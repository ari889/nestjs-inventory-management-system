import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';
export const Permission = (slug: string) => SetMetadata(PERMISSION_KEY, slug);
