import { Attribute } from './Attribute';
import { Staff } from './Staff';

export interface StaffValue {
    id: number;
    staff: Staff;
    attribute: Attribute;
    value: string;
}
