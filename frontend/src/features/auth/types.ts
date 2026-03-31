export interface SignInFormValues {
    email: string;
    password: string;
}

export interface SignUpFormValues {
    email: string;
    fullName: string;
    password: string;
    role: string;
}

export interface ResetPasswordFormValues {
    email: string;
}

export interface SignInFormErrors {
    email?: string;
    password?: string;
}

export interface SignUpFormErrors {
    email?: string;
    fullName?: string;
    password?: string;
    role?: string;
}

export interface ResetPasswordFormErrors {
    email?: string;
}