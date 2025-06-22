export type Entity = {
    id: string;
}

export type User = {
    id: string;
    name: string;
    email: string;
    role: "Factory Manager" | "Warehouse Supervisor" | "Shipping Clerk" | "Regional Hub Manager";
    company: string;
    location: Entity;
};

export type Shipment = {
    id: string;
    trackingNumber: string;
    fromLocation: Entity;
    toLocation: Entity;
    items: Entity[];
    initiatedBy: Entity;
    status: ShipmentStatus;
    shippedDate: string | null;
    deliveredDate: string | null;
};
export type ShipmentStatus = "Pending" | "In Transit" | "Delivered";

export type Location = {
    id: string;
    name: string;
    type: "Factory" | "Warehouse" | "Distribution Hub" | "Local Depot";
    city: string;
};

export type Item = {
    id: string;
    sku: string;
    name: string;
    description: string;
    color: "Black" | "White" | "Red" | "Blue" | "Green";
    size: "X-Small" | "Small" | "Medium" | "Large" | "X-Large";
};