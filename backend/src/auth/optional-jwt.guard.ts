import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();

    try {
      request.user = await this.authService.authenticateBearerToken(token);
    } catch {
      request.user = null;
    }

    return true;
  }
}
