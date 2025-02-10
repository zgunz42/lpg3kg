import { GET_NEARBY_MERCHANT_QUERY } from "../constants";
import { client } from "@/lib/client";
import { useQuery } from '@tanstack/react-query';

export const useMerchantMap = (point: [number, number]) => {
  const {
    data: nearbyMerchants,
    isPending: isLoadingMerchants,
    isError: isErrorMerchants,
    refetch: refetchMerchants,
    error: nearbyMerchantError,
  } = useQuery({
    queryKey: [GET_NEARBY_MERCHANT_QUERY],
    queryFn: async () => {
      const res = await client.merchant.near.$get({
        latitude: point[0],
        longitude: point[1],
      });
      const jsonRes = await res.json();

      return jsonRes.data;
    },
  });
};
