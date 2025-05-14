import { StaffType } from './Staff-type';
import { StaffValue } from './Staff-value';

export interface Staff {
    id: number;
    staffType: StaffType;
    createdAt: string;
    staffValues: StaffValue[];
}
