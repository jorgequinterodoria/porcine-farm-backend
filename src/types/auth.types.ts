export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;

  // Datos del tenant (solo para el primer usuario/admin)
  tenantName?: string;
  tenantSubdomain?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string | null;
    farmId?: string | null;
  };
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    subscriptionPlan: string;
  } | null;
  token: string;
  expiresIn: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}