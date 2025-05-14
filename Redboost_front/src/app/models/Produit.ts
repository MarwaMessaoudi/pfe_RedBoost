export class Produit {
    id?: number;
    name: string;
    description?: string;
    price: number;
    stock: number;
    ventes: number;
    poids: number;
    categorie: string;
    dateExpiration?: string;
    image?: string;
    isFavorite: boolean = false; // Added isFavorite property

    constructor(name: string, price: number, stock: number, ventes: number, poids: number, categorie: string, dateExpiration: string = '', description: string = '', image: string = '', id?: number) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.ventes = ventes;
        this.poids = poids;
        this.categorie = categorie;
        this.dateExpiration = dateExpiration;
        this.image = image;
        this.isFavorite = false;
    }
}
