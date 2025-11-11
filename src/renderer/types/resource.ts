export interface Resource {
  id: string;
  name: string;
  role?: string;
  email?: string;
  department?: string;
  availability: number; // 0-100%
  createdAt: string;
  updatedAt: string;
}

export interface ResourceInput {
  name: string;
  role?: string;
  email?: string;
  department?: string;
  availability?: number;
}
