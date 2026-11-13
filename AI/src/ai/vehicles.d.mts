export interface Vehicle {
  id: string;
  name: string;
  kind: string;
  glb: string;
  image: string;
}
export const VEHICLES: Vehicle[];
export function vehicleById(id: string): Vehicle | undefined;
