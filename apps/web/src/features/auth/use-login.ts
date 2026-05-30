import { useMutation } from "@tanstack/react-query";

import { login } from "@/data/auth-client";

export function useLogin() {
  return useMutation({ mutationFn: login });
}
