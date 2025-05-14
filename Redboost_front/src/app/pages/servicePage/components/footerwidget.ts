import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'footer-widget',
    standalone: true,
    imports: [RouterModule],
    template: `
        <!-- Banner -->
        <div class="banner flex justify-between items-center bg-gradient-to-r from-[#034A55] via-[#6A2C3D] to-[#C8223A] shadow-lg text-white px-8 py-3 md:px-20 lg:px-32 h-[50px] z-50">
            <div class="text-xl md:text-2xl font-bold text-e6edee">
                <p>Demander une Démot</p>
            </div>
            <button class="border-2 border-e6edee text-034a55 font-semibold px-6 py-1 rounded-lg bg-opacity-0 hover:bg-white hover:text-black hover:scale-110 hover:shadow-xl transition duration-300 ease-in-out transform-gpu">
            Réserver
            </button>
        </div>

        <!-- Footer Content -->
        <div class="footer-container bg-[#0A4955] text-white py-12 px-6 lg:px-20 overflow-visible">
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 md:col-span-4">
                    <a (click)="router.navigate(['/pages/landing'], { fragment: 'home' })" class="flex items-center cursor-pointer mb-6">
                        <img src="assets/Capture-removebg-preview.png" alt="Logo" class="h-12 mr-2">
                        <h4 class="font-medium text-3xl text-white">RedBoost</h4>
                    </a>
                    <p class="text-lg text-gray-300">
                        Your All-in-One Platform for Efficient Program Management, Startup Support, and Seamless Communication.
                    </p>
                </div>

                <div class="col-span-12 md:col-span-2">
                    <h4 class="font-medium text-2xl mb-6">Quick Links</h4>
                    <ul class="list-none p-0">
                        <li class="mb-3">
                            <a (click)="router.navigate(['/pages/landing'], { fragment: 'about' })" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300 cursor-pointer">About Us</a>
                        </li>
                        <li class="mb-3">
                            <a (click)="router.navigate(['/pages/landing'], { fragment: 'services' })" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300 cursor-pointer">Our Services</a>
                        </li>
                        <li class="mb-3">
                            <a (click)="router.navigate(['/pages/landing'], { fragment: 'resources' })" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300 cursor-pointer">Resources</a>
                        </li>
                        <li class="mb-3">
                            <a (click)="router.navigate(['/pages/landing'], { fragment: 'pricing' })" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300 cursor-pointer">Pricing</a>
                        </li>
                        <li>
                            <a (click)="router.navigate(['/pages/landing'], { fragment: 'contact' })" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300 cursor-pointer">Contact</a>
                        </li>
                    </ul>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <h4 class="font-medium text-2xl mb-6">Contact Us</h4>
                    <ul class="list-none p-0">
                        <li class="mb-3">
                            <a href="tel:+216 71 793 125" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300">
                                <i class="pi pi-phone mr-2"></i>+216 71 793 125
                            </a>
                        </li>
                        <li class="mb-3">
                            <a href="contactredstart.tn" class="text-lg text-gray-300 hover:text-[#DB1E37] transition-colors duration-300">
                                <i class="pi pi-envelope mr-2"></i>contactredstart.tn
                            </a>
                        </li>
                        <li>
                            <div class="flex items-center gap-4 mt-4">
                                <a href="https://tn.linkedin.com/company/redstart-tunisie" target="_blank" class="text-gray-300 hover:text-[#DB1E37] transition-colors duration-300">
                                    <i class="pi pi-linkedin text-2xl"></i>
                                </a>
                                <a href="https://www.instagram.com/redstart_tunisie/" target="_blank" class="text-gray-300 hover:text-[#DB1E37] transition-colors duration-300">
                                    <i class="pi pi-instagram text-2xl"></i>
                                </a>
                                <a href="https://www.facebook.com/redstartunisie/?locale=fr_FR" target="_blank" class="text-gray-300 hover:text-[#DB1E37] transition-colors duration-300">
                                    <i class="pi pi-facebook text-2xl"></i>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="col-span-12 md:col-span-3">
                    <h4 class="font-medium text-2xl mb-6">Abonnez-vous à notre newsletter</h4>
                    <p class="text-lg text-gray-300 mb-4">
                    Restez informé(e) des dernières actualités et nouveautés de RedBoos
                    </p>
                    <div class="flex items-center">
                        <input type="email" placeholder="Enter your email" class="w-full p-2 rounded-l-lg bg-white text-gray-900 focus:outline-none">
                        <button class="bg-[#DB1E37] text-white p-2 rounded-r-lg hover:bg-[#0A4955] transition-colors duration-300">
                        Abonnez-vous
                        </button>
                    </div>
                </div>
            </div>

            <div class="border-t border-gray-700 my-8"></div>

            <div class="text-center text-gray-300">
                <p>&copy; 2025 RedBoost. All rights reserved.</p>
            </div>
        </div>
    `,
    styles: [`
        .banner {
            background: linear-gradient(to right, #034A55, #6A2C3D, #C8223A);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .footer-container a {
            transition: color 0.3s ease-in-out;
        }
        .footer-container a:hover {
            color: #DB1E37;
        }
        .footer-container input {
            border: none;
        }
        .footer-container button {
            border: none;
            cursor: pointer;
        }
    `]
})
export class FooterWidget {
    constructor(public router: Router) {}
}
