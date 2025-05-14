import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-contact-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('inputFocus', [
      state('inactive', style({
        transform: 'scale(1)',
        borderColor: '#EA7988',
      })),
      state('active', style({
        transform: 'scale(1.02)',
        borderColor: '#C45A6A',
      })),
      transition('inactive <=> active', [
        animate('200ms ease-in-out')
      ]),
    ]),
    trigger('buttonHover', [
      state('normal', style({
        transform: 'scale(1)',
        backgroundColor: '#245C67',
      })),
      state('hovered', style({
        transform: 'scale(1.05)',
        backgroundColor: '#0A4955',
      })),
      transition('normal <=> hovered', [
        animate('200ms ease-in-out')
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
    ]),
  ],
  template: `
    <div class="container">
      <div class="contact-form">
        <!-- Back Arrow -->
        <div class="back-arrow">
          <a routerLink="/landing">
            <span class="pi pi-arrow-left"></span>
          </a>
        </div>
        <h2 class="section-title get-in-touch">Get in touch</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="input-group">
            
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              [(ngModel)]="formData.name"
              name="name"
              required
              [ngClass]="{'focused': nameFocused}"
              (focus)="nameFocused = true"
              (blur)="nameFocused = false"
              [@inputFocus]="nameFocused ? 'active' : 'inactive'"
            />
          </div>
          <div class="input-group">
         
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              [(ngModel)]="formData.email"
              name="email"
              required
              [ngClass]="{'focused': emailFocused}"
              (focus)="emailFocused = true"
              (blur)="emailFocused = false"
              [@inputFocus]="emailFocused ? 'active' : 'inactive'"
            />
          </div>
          <div class="input-group">
            
            <input
              id="subject"
              type="text"
              placeholder="Enter your subject"
              [(ngModel)]="formData.subject"
              name="subject"
              required
              [ngClass]="{'focused': subjectFocused}"
              (focus)="subjectFocused = true"
              (blur)="subjectFocused = false"
              [@inputFocus]="subjectFocused ? 'active' : 'inactive'"
            />
          </div>
          <div class="input-group">
            
            <textarea
              id="message"
              placeholder="Enter your message"
              [(ngModel)]="formData.message"
              name="message"
              required
              [ngClass]="{'focused': messageFocused}"
              (focus)="messageFocused = true"
              (blur)="messageFocused = false"
              [@inputFocus]="messageFocused ? 'active' : 'inactive'"
            ></textarea>
          </div>
          <button
            type="submit"
            [@buttonHover]="buttonState"
            (mouseenter)="buttonState = 'hovered'"
            (mouseleave)="buttonState = 'normal'"
          >
            Send Message
          </button>
        </form>
      </div>
      <div class="contact-info" [@fadeIn]>
        <h2 class="section-title">Contact us</h2>
        <p>
          <span class="pi pi-map-marker"></span>
          <a href="https://maps.google.com/?q=198+West+21th+Street,+Suite+721+New+York+NY+10016" target="_blank">
            Address: 198 West 21th Street, Suite 721 New York NY 10016
          </a>
        </p>
        <p>
          <span class="pi pi-phone"></span>
          <a href="tel:+1235235598">
            Phone: +1235 2355 98
          </a>
        </p>
        <p>
          <span class="pi pi-envelope"></span>
          <a href="mailto:hello@redstart.tn">
            Email: helloredstart.tn
          </a>
        </p>
        <p>
          <span class="pi pi-globe"></span>
          <a href="https://yoursite.com" target="_blank">
            Website: yoursite.com
          </a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Arial', sans-serif; /* Match signup/sign-in font */
      background-color: #f5f7fa; /* Match signup/sign-in background */
      padding: 2rem;
      width: 100%;
    }

    .container {
      display: flex;
      max-width: 900px;
      width: 100%;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Match signup/sign-in shadow */
      overflow: hidden;
    }

    .contact-form, .contact-info {
      padding: 2rem;
      width: 50%;
    }

    .contact-form {
      background: white;
      border-radius: 10px 0 0 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative; /* For positioning the back arrow */
    }

    /* Back Arrow Styles */
    .back-arrow {
      position: absolute;
      top: 1rem;
      left: 1rem;
    }

    .back-arrow a {
      color: #245C67; /* custom-dark-blue */
      text-decoration: none;
      font-size: 1.2rem;
      transition: color 0.3s ease;
    }

    .back-arrow a:hover {
      color: #DB1E37; /* custom-red */
    }

    .section-title {
      color: white; /* custom-dark-blue */
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
      position: relative;
      display: inline-block;
    }

    .section-title.get-in-touch {
      color: #245C67;
      margin-right:270px; /* custom-red */
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 50%;
      height: 2px;
      background: #DB1E37; /* Match signup/sign-in underline */
    }

    .contact-form form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    /* Input Fields */
    .input-group {
      
      text-align: left;
    }

    label {
      display: block;
      color: #245C67; /* custom-dark-blue */
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    .contact-form input, .contact-form textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #568086; /* custom-light-blue */
      border-radius: 5px;
      font-size: 1rem;
      color: #245C67; /* custom-dark-blue */
      background: #f9f9f9;
      transition: all 0.3s ease;
    }

    .contact-form input:focus, .contact-form textarea:focus {
      outline: none;
      border-color: #DB1E37; /* custom-red */
      background: #fff;
      box-shadow: none; /* Remove the original shadow */
    }

    .contact-form textarea {
      height: 120px;
      resize: vertical;
    }

    .contact-form button {
      padding: 0.75rem;
      background-color: #DB1E37; /* custom-red */
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .contact-form button:hover {
      background-color: #E44D62; /* custom-pink */
    }

    .contact-info {
      background: #0A4955; /* Match signup/sign-in background */
      color: white;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      border-radius: 0 10px 10px 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .contact-info p {
      display: flex;
      align-items: center;
      margin: 15px 0;
      font-size: 1rem;
      font-weight: 300;
      opacity: 0.9;
      transition: opacity 0.3s ease;
      color: white;
    }

    .contact-info p:first-of-type {
      margin-top: 50px;
    }

    .contact-info p:hover {
      opacity: 1;
    }

    .contact-info p a {
      color: white;
      text-decoration: none;
      transition: color 0.3s ease, text-decoration 0.3s ease;
    }

    .contact-info p a:hover {
      color: #EA7988;
      text-decoration: underline;
    }

    .contact-info span {
      margin-right: 10px;
      font-size: 1.2rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }

      .contact-form, .contact-info {
        width: 100%;
        border-radius: 10px;
      }

      .contact-form {
        border-radius: 10px 10px 0 0;
      }

      .contact-info {
        border-radius: 0 0 10px 10px;
      }
    }
  `]
})
export class ContactLandingComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  nameFocused = false;
  emailFocused = false;
  subjectFocused = false;
  messageFocused = false;
  buttonState = 'normal';

  constructor(private router: Router) {}

  onSubmit() {
    console.log('Form submitted:', this.formData);
    alert('Message sent successfully!');
    this.formData = { name: '', email: '', subject: '', message: '' };
  }
}