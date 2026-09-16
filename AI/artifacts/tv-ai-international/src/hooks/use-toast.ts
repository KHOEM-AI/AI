import * as React from "react";

export function useToast() {
  return {
    toasts: [],
    toast: (props: any) => {},
    dismiss: (id?: string) => {},
  };
}
export const toast = (props: any) => {};
