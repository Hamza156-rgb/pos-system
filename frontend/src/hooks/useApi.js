import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useFetch = (key, url, params = {}, options = {}) =>
  useQuery({
    queryKey: [key, params],
    queryFn: async () => (await api.get(url, { params })).data,
    ...options,
  });

export const useCreate = (url, invalidate) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post(url, body)).data,
    onSuccess: () => invalidate && qc.invalidateQueries({ queryKey: [invalidate] }),
  });
};

export const useUpdate = (urlFn, invalidate) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.put(urlFn(id), body)).data,
    onSuccess: () => invalidate && qc.invalidateQueries({ queryKey: [invalidate] }),
  });
};

export const useRemove = (urlFn, invalidate) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(urlFn(id))).data,
    onSuccess: () => invalidate && qc.invalidateQueries({ queryKey: [invalidate] }),
  });
};
