import type {
  ResetPasswordFormValues,
  SignInFormValues,
  SignUpFormValues,
} from "./types";

function simulateRequest() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 400);
  });
}

export async function signIn(_: SignInFormValues & { rememberMe: boolean }) {
  await simulateRequest();
}

export async function signUp(_: SignUpFormValues) {
  await simulateRequest();
}

export async function requestPasswordReset(_: ResetPasswordFormValues) {
  await simulateRequest();
}
