export enum Objectives {
    COURT_TERME = 'COURT_TERME',
    MOYEN_TERME = 'MOYEN_TERME',
    LONG_TERME = 'LONG_TERME'
}

export enum Statut {
    EN_DEVELOPPEMENT = 'EN_DEVELOPPEMENT',
    OPERATIONNELLE = 'OPERATIONNELLE',
    EN_RECHERCHE_FINANCEMENT = 'EN_RECHERCHE_FINANCEMENT',
    TERMINE = 'TERMINE'
}
import { Produit } from './Produit';
import { ServiceP } from './ServiceP';

export class Projet {
    id?: number;
    name: string;
    sector: string;
    type: string;
    creationDate: string;
    description: string;
    objectives: Objectives;
    status: Statut;
    globalScore: number;
    location: string;
    logoUrl: string;
    websiteUrl: string;
    revenue: number;
    numberOfEmployees: number;
    nbFemaleEmployees: number;
    lastUpdated: string;
    associatedSectors: string;
    technologiesUsed: string;
    fundingGoal: number;
    lastEvaluationDate: string;
    produits: Produit[];
    services: ServiceP[];
    folders: any[];
    phases: any[];
    founder: number | null; // Changed from User to number
    entrepreneurs: number[]; // Changed from User[] to number[]
    coaches: number[]; // Changed from User[] to number[]
    investors: number[]; // Changed from User[] to number[]
    pendingCollaborator: number | null; // Changed from User to number

    constructor(
        name: string,
        sector: string,
        type: string,
        creationDate: string,
        description: string = '',
        objectives: Objectives = Objectives.COURT_TERME,
        status: Statut = Statut.EN_DEVELOPPEMENT,
        globalScore: number = 0,
        location: string = '',
        logoUrl: string = '',
        websiteUrl: string = '',
        revenue: number = 0,
        numberOfEmployees: number = 0,
        nbFemaleEmployees: number = 0,
        lastUpdated: string = '',
        associatedSectors: string = '',
        technologiesUsed: string = '',
        fundingGoal: number = 0,
        lastEvaluationDate: string = '',
        produits: Produit[] = [],
        services: ServiceP[] = [],
        folders: any[] = [],
        phases: any[] = [],
        founder: number | null = null, // Changed from User to number
        entrepreneurs: number[] = [], // Changed from User[] to number[]
        coaches: number[] = [], // Changed from User[] to number[]
        investors: number[] = [], // Changed from User[] to number[]
        pendingCollaborator: number | null = null // Changed from User to number
    ) {
        this.id = undefined;
        this.name = name;
        this.sector = sector;
        this.type = type;
        this.creationDate = creationDate;
        this.description = description;
        this.objectives = objectives;
        this.status = status;
        this.globalScore = globalScore;
        this.location = location;
        this.logoUrl = logoUrl;
        this.websiteUrl = websiteUrl;
        this.revenue = revenue;
        this.numberOfEmployees = numberOfEmployees;
        this.nbFemaleEmployees = nbFemaleEmployees;
        this.lastUpdated = lastUpdated;
        this.associatedSectors = associatedSectors;
        this.technologiesUsed = technologiesUsed;
        this.fundingGoal = fundingGoal;
        this.lastEvaluationDate = lastEvaluationDate;
        this.produits = produits;
        this.services = services;
        this.folders = folders;
        this.phases = phases;
        this.founder = founder;
        this.entrepreneurs = entrepreneurs;
        this.coaches = coaches;
        this.investors = investors;
        this.pendingCollaborator = pendingCollaborator;
    }
}
