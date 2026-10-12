import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useWorkspace() {
  return useQuery(orpc.workspace.read.queryOptions());
}
export function useActions() {
  const cache = useQueryClient();
  const refresh = () => cache.invalidateQueries({ queryKey: orpc.workspace.key() });
  const save = useMutation(
    orpc.workspace.save.mutationOptions({
      onMutate: async ({ kind, item }) => {
        const key = orpc.workspace.read.queryOptions().queryKey;
        await cache.cancelQueries({ queryKey: key });
        const previous = cache.getQueryData(key);
        if (previous)
          cache.setQueryData(key, {
            ...previous,
            data: {
              ...previous.data,
              [kind]: [...previous.data[kind].filter((e) => e.id !== item.id), item],
            },
          });
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous)
          cache.setQueryData(orpc.workspace.read.queryOptions().queryKey, context.previous);
      },
      onSettled: refresh,
    }),
  );
  const remove = useMutation(orpc.workspace.remove.mutationOptions({ onSuccess: refresh }));
  const upload = useMutation(orpc.workspace.upload.mutationOptions({ onSuccess: refresh }));
  const start = useMutation(orpc.workspace.startTimer.mutationOptions({ onSuccess: refresh }));
  const stop = useMutation(orpc.workspace.stopTimer.mutationOptions({ onSuccess: refresh }));
  return {
    save,
    remove,
    upload,
    start,
    stop,
    busy:
      save.isPending || remove.isPending || upload.isPending || start.isPending || stop.isPending,
  };
}
export type Actions = ReturnType<typeof useActions>;
