class Projet {
    constructor(id, title, description, customer, date, roles, resultUrl, imageBannerUrl) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.customer = customer;
        this.date = date;
        this.roles = roles;
        this.resultUrl = resultUrl;
        this.imageBannerUrl = imageBannerUrl;
    }
    
    afficherDetails() {
        console.log(`Page ID: ${this.id}`);
        console.log(`Titre: ${this.title}`);
        console.log(`Description: ${this.description}`);
        console.log(`Client: ${this.customer}`);
        console.log(`Date: ${this.date}`);
        console.log(`Roles: ${this.roles.join(', ')}`);
        console.log(`Lien résultat: ${this.resultUrl}`);
        console.log(`Lien image bannière: ${this.imageBannerUrl}`);
        console.log('---');
    }
}

module.exports = { Projet };