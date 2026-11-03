export declare class CreateProductDto {
    name: string;
    slug: string;
    description?: string;
    price: number;
    compareAtPrice?: number | null;
    images?: string[];
    isActive?: boolean;
    categoryId: string;
}
