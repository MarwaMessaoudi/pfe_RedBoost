import { Attribute } from './Attribute';

export interface StaffType {
    id: number;
    typeName: string;
    createdAt: string;
    attributes: Attribute[];
}

export interface StaffTypeAttribute {
    id: number;
    attribute: Attribute;
    default: boolean;
}
