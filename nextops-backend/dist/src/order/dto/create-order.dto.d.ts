export declare class ShippingAddressDto {
    country: string;
    city: string;
    street: string;
    zipCode: string;
}
export declare class OrderItemInputDto {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    currency?: string;
    shippingAddress?: ShippingAddressDto;
    items: OrderItemInputDto[];
}
