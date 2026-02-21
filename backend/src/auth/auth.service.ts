import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// In-memory login attempt tracking (use Redis in production)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Send verification email (non-blocking)
    this.sendVerificationEmail(user.id, user.email, user.firstName).catch(
      (err) => this.logger.error(`Failed to send verification email: ${err}`),
    );

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    // Check account lockout
    this.checkLockout(dto.email);

    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.recordFailedAttempt(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(dto.email);

    await this.users.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── Password Reset ─────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = this.jwt.sign(
      { sub: user.id, purpose: 'password-reset' },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '1h', // Reset link valid for 1 hour
      },
    );

    const frontendUrl = this.config.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    await this.email.send({
      to: user.email,
      subject: 'Reset Your Crayons & Quills Password',
      template: 'password-reset',
      data: {
        firstName: user.firstName || 'there',
        resetUrl,
      },
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        purpose: string;
      }>(token, { secret: this.config.get('JWT_SECRET') });

      if (payload.purpose !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const user = await this.users.findById(payload.sub);
      if (!user) {
        throw new BadRequestException('Invalid reset token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await this.users.updatePassword(user.id, passwordHash);
      this.logger.log(`Password reset completed for user ${user.id}`);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        'Reset link has expired or is invalid. Please request a new one.',
      );
    }
  }

  // ─── Email Verification ─────────────────────────────────────────

  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName?: string,
  ): Promise<void> {
    const verifyToken = this.jwt.sign(
      { sub: userId, purpose: 'email-verify' },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '7d',
      },
    );

    const frontendUrl = this.config.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${verifyToken}`;

    await this.email.send({
      to: email,
      subject: 'Verify Your Crayons & Quills Email',
      template: 'email-verification',
      data: {
        firstName: firstName || 'there',
        verifyUrl,
      },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        purpose: string;
      }>(token, { secret: this.config.get('JWT_SECRET') });

      if (payload.purpose !== 'email-verify') {
        throw new BadRequestException('Invalid verification token');
      }

      await this.users.markEmailVerified(payload.sub);
      this.logger.log(`Email verified for user ${payload.sub}`);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        'Verification link has expired. Please request a new one.',
      );
    }
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.users.findByIdOrThrow(userId);
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    await this.sendVerificationEmail(user.id, user.email, user.firstName);
  }

  // ─── Login Lockout ──────────────────────────────────────────────

  private checkLockout(email: string): void {
    const attempts = loginAttempts.get(email);
    if (attempts && attempts.lockedUntil > Date.now()) {
      const minutesLeft = Math.ceil(
        (attempts.lockedUntil - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
      );
    }
  }

  private recordFailedAttempt(email: string): void {
    const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
    attempts.count += 1;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      this.logger.warn(
        `Account locked for ${email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
      );
    }

    loginAttempts.set(email, attempts);
  }

  // ─── Token Generation ──────────────────────────────────────────

  private generateTokens(
    userId: string,
    email: string,
    role: string,
  ): AuthTokens {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '30d'),
    });

    return { accessToken, refreshToken };
  }
}
