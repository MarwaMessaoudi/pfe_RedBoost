export class ServiceP {
    id?: number;
    name: string;
    description: string;
    price: number;
    typeservice: string;
    subServices: string[];

    constructor(name: string, description: string, price: number, typeservice: string, subServices: string[] = []) {
        this.id = undefined;
        this.name = name;
        this.description = description;
        this.price = price;
        this.typeservice = typeservice;
        this.subServices = subServices;
    }
}

export class Pack {
    id?: number;
    name: string;
    description: string;
    services: ServiceP[];
    price: number;
    isHighlighted: boolean;

    constructor(name: string, description: string, services: ServiceP[] = [], price: number, isHighlighted: boolean = false) {
        this.name = name;
        this.description = description;
        this.services = services;
        this.price = price;
        this.isHighlighted = isHighlighted;
    }
}
