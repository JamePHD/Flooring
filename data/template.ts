//template
export interface Item{
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  }

//import data
//categoryID taken from route.ts
export const FLOORING_PRODUCT: Item[] = [
  {id: 1, categoryId: 1, name: "cate1pro1", slug: "cate1-pro1", price: 0.0, description: "..."},
  {id: 2, categoryId: 1, name: "cate1pro2", slug: "cate1-pro2", price: 0.0, description: "..."},

  {id: 1, categoryId: 2, name: "cate2pro1", slug: "cate2-pro1", price: 0.0, description: "..."},
  {id: 2, categoryId: 2, name: "cate2pro2", slug: "cate2-pro2", price: 0.0, description: "..."}
  ];
