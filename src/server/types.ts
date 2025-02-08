export interface MerchantResponse extends BaseResponse<MerchantData> {}

export interface MerchantData {
  isAvailableMerchant: boolean;
  merchants:           Merchant[];
}

export interface Merchant {
  merchantName:   string;
  address:        string;
  registrationId: string;
  location:       Location;
  distance:       number;
}

export interface Location {
  latitude:  number;
  longitude: number;
}

export interface BaseResponse<T> {
  success: boolean;
  data:    T;
  message: string;
  code:    number;
}