import { useState } from "react";
import { toast } from "sonner";

export function useAsync() {
  const [loading, setLoading] = useState(false);

  const execute = async <T>(
    promise: Promise<T>,
    successMessage?: string,
  ): Promise<T> => {
    try {
      setLoading(true);
      const result = await promise;
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, execute };
}
