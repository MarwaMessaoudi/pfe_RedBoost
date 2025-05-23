import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../pages/frontoffice/service/auth.service';
import { RendezVousService, RendezVousDTO } from '../../pages/frontoffice/service/RendezVousService';
import { UserService } from '../../pages/frontoffice/service/UserService';
import { NotificationService } from '../../pages/frontoffice/gestion_messagerie/notification.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Menu } from 'primeng/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';

interface ConversationDTO {
    id: number;
    titre: string;
    estGroupe: boolean;
    creatorId?: number;
    participantIds: number[];
}

interface NotificationItem {
    conversationId: number;
    name: string;
    unreadCount: number;
    isGroup: boolean;
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, MenuModule, DialogModule, ButtonModule, InputTextModule, ChipModule, ReactiveFormsModule, FormsModule, AppConfigurator, MatTooltipModule],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img src="/assets/images/logo_redboost.png" alt="RedBoost Logo" class="redboost-logo" />
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <div class="relative">
                        <a
                            routerLink="/gestion-reclamation"
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                            matTooltip="Ajouter une réclamation"
                        >
                            <i class="pi pi-plus"></i>
                        </a>
                        <app-configurator />
                    </div>
                </div>

                <!-- Notification Icon with Badge and Dropdown -->
                <div class="notification-container" #notificationContainer>
                    <a class="layout-topbar-action" (click)="toggleNotificationDropdown($event)">
                        <i class="pi pi-bell"></i>
                        <span class="notification-badge">{{ unreadMessageCount || 0 }}</span>
                        <!-- Debug count -->
                        <span class="debug-count">Debug: {{ unreadMessageCount }}</span>
                    </a>
                    <div class="notification-dropdown" *ngIf="showNotificationDropdown">
                        <div class="dropdown-header">
                            <h3>Notifications</h3>
                            <button class="refresh-btn" (click)="refreshNotifications()">↻</button>
                            <button class="close-btn" (click)="showNotificationDropdown = false">×</button>
                        </div>
                        <div class="dropdown-body">
                            <div class="notification-item" *ngFor="let item of notificationItems" (click)="navigateToConversation(item.conversationId)">
                                <div class="notification-content">
                                    <h4>{{ item.name }}</h4>
                                    <p>{{ item.unreadCount }} message{{ item.unreadCount > 1 ? 's' : '' }} non lu{{ item.unreadCount > 1 ? 's' : '' }}</p>
                                </div>
                            </div>
                            <p *ngIf="notificationItems.length === 0" class="no-notifications">Aucun message non lu.</p>
                        </div>
                    </div>
                </div>

                <!-- Join Now Button -->
                <button *ngIf="joinableRendezVous && joinableRendezVous.canJoinNow" class="layout-topbar-action join-now-button" (click)="joinMeeting(joinableRendezVous.meetingLink)">
                    <i class="pi pi-video"></i>
                    <span>Rejoindre maintenant</span>
                </button>

                <!-- Profile Menu -->
                <div class="profile-menu-container">
                    <button class="layout-topbar-action profile-icon-container" (click)="toggleProfileMenu($event)">
                        <img *ngIf="user?.profile_pictureurl" [src]="user.profile_pictureurl" alt="Profile Photo" class="profile-picture" />
                        <i *ngIf="!user?.profile_pictureurl" class="pi pi-user-circle"></i>
                    </button>
                    <p-menu #profileMenu [model]="profileItems" [popup]="true" appendTo="body">
                        <ng-template pTemplate="start">
                            <div class="profile-menu-header">
                                <div class="profile-icon-container">
                                    <img *ngIf="user?.profile_pictureurl" [src]="user.profile_pictureurl" alt="Profile Photo" class="profile-picture" />
                                    <i *ngIf="!user?.profile_pictureurl" class="pi pi-user-circle"></i>
                                </div>
                                <div class="profile-info">
                                    <span class="profile-name">{{ user?.firstName }} {{ user?.lastName }}</span>
                                    <span class="profile-role">{{ user?.role }}</span>
                                </div>
                            </div>
                        </ng-template>
                    </p-menu>
                </div>

                <!-- Settings Dialog -->
                <p-dialog header="Update Profile" [(visible)]="settingsVisible" [modal]="true" [style]="{ width: '50vw' }" styleClass="profile-dialog">
                    <div class="dialog-content">
                        <!-- Filter Bar -->
                        <div class="filter-bar">
                            <button class="filter-btn" [ngClass]="{ active: activeFilter === 'all' }" (click)="setFilter('all')">All</button>
                            <button class="filter-btn" [ngClass]="{ active: activeFilter === 'personal' }" (click)="setFilter('personal')">Personal</button>
                            <button class="filter-btn" [ngClass]="{ active: activeFilter === 'about' }" (click)="setFilter('about')">About Me</button>
                            <button class="filter-btn" [ngClass]="{ active: activeFilter === 'social' }" (click)="setFilter('social')">Social Media</button>
                            <button class="filter-btn" [ngClass]="{ active: activeFilter === 'coaching' }" (click)="setFilter('coaching')">
                                {{ userRole === 'COACH' ? 'Coaching' : 'Business' }}
                            </button>
                        </div>

                        <!-- Form Content -->
                        <form *ngIf="profileForm" [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                            <!-- Personal Information Card -->
                            <div class="card personal-card animate-card" *ngIf="activeFilter === 'all' || activeFilter === 'personal'">
                                <div class="card-header">
                                    <h3><i class="pi pi-user"></i> Personal Information</h3>
                                </div>
                                <div class="card-content">
                                    <div class="form-group">
                                        <label for="email">Email</label>
                                        <input id="email" type="email" pInputText formControlName="email" placeholder="Enter your email" />
                                    </div>
                                    <div class="form-group">
                                        <label for="phone">Phone</label>
                                        <input id="phone" type="text" pInputText formControlName="phone" placeholder="Enter your phone number" />
                                    </div>
                                </div>
                            </div>

                            <!-- About Me Card -->
                            <div class="card about-card animate-card" *ngIf="activeFilter === 'all' || activeFilter === 'about'">
                                <div class="card-header">
                                    <h3><i class="pi pi-quote-left"></i> About Me</h3>
                                </div>
                                <div class="card-content">
                                    <div class="form-group">
                                        <label for="bio">Bio</label>
                                        <textarea id="bio" formControlName="bio" rows="4" placeholder="Tell us about yourself (max 500 characters)" class="bio-textarea"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Social Media Card -->
                            <div class="card social-card animate-card" *ngIf="activeFilter === 'all' || activeFilter === 'social'">
                                <div class="card-header">
                                    <h3><i class="pi pi-share-alt"></i> Social Media</h3>
                                </div>
                                <div class="card-content">
                                    <div class="form-group">
                                        <label for="linkedin">LinkedIn</label>
                                        <input id="linkedin" type="text" pInputText formControlName="linkedin" placeholder="https://linkedin.com/in/username" />
                                    </div>
                                    <div class="form-group">
                                        <label for="facebook">Facebook</label>
                                        <input id="facebook" type="text" pInputText formControlName="facebook" placeholder="https://facebook.com/username" />
                                    </div>
                                    <div class="form-group">
                                        <label for="instagram">Instagram</label>
                                        <input id="instagram" type="text" pInputText formControlName="instagram" placeholder="https://instagram.com/username" />
                                    </div>
                                </div>
                            </div>

<!-- Coaching/Business Information Card -->
<div class="card coaching-card animate-card" *ngIf="(activeFilter === 'all' || activeFilter === 'coaching') && userRole === 'COACH'">
    <div class="card-header">
        <h3><i class="pi pi-graduation-cap"></i> Coaching Information</h3>
    </div>
    <div class="card-content">
        <div class="form-group">
            <label for="yearsOfExperience">Years of Experience</label>
            <input id="yearsOfExperience" type="number" pInputText formControlName="yearsOfExperience" placeholder="Enter years of experience" />
        </div>
        <div class="form-group">
            <label for="skillsInput">Skills</label>
            <input id="skillsInput" type="text" pInputText [(ngModel)]="skillInput" (keydown)="addSkill($event)" [ngModelOptions]="{ standalone: true }" placeholder="Type a skill and press Enter" />
            <div class="chip-container">
                <p-chip *ngFor="let skill of skills" [label]="skill" [removable]="true" (onRemove)="removeSkill(skill)"></p-chip>
            </div>
           
        </div>
        <div class="form-group">
            <label for="expertiseInput">Expertise</label>
            <input id="expertiseInput" type="text" pInputText [(ngModel)]="expertiseInput" (keydown)="addExpertise($event)" [ngModelOptions]="{ standalone: true }" placeholder="Type an expertise and press Enter" />
            <div class="chip-container">
                <p-chip *ngFor="let expertise of expertise" [label]="expertise" [removable]="true" (onRemove)="removeExpertise(expertise)"></p-chip>
            </div>

        </div>
    </div>
</div>

                            <!-- Business Information Card (for Entrepreneurs) -->
                            <div class="card business-card animate-card" *ngIf="(activeFilter === 'all' || activeFilter === 'coaching') && userRole === 'ENTREPRENEUR'">
                                <div class="card-header">
                                    <h3><i class="pi pi-briefcase"></i> Business Information</h3>
                                </div>
                                <div class="card-content">
                                    <div class="form-group">
                                        <label for="startupName">Startup Name</label>
                                        <input id="startupName" type="text" pInputText formControlName="startupName" placeholder="Enter your startup name" />
                                    </div>
                                    <div class="form-group">
                                        <label for="industry">Industry</label>
                                        <input id="industry" type="text" pInputText formControlName="industry" placeholder="Enter your industry" />
                                    </div>
                                </div>
                            </div>

                            <!-- Form Actions -->
                            <div class="form-actions">
                                <button type="submit" pButton label="Save" [disabled]="!profileForm.valid || isSubmitting" [icon]="isSubmitting ? 'pi pi-spinner pi-spin' : ''" class="save-btn"></button>
                                <button type="button" pButton label="Cancel" (click)="settingsVisible = false" class="cancel-btn"></button>
                            </div>
                        </form>
                    </div>
                </p-dialog>
            </div>
        </div>
    `,
    styles: [
        `
            $dark-teal: #0a4955;
            $teal-1: #245c67;
            $teal-2: #568086;
            $red: #db1e37;
            $pink-1: #e44d62;
            $pink-2: #ea7988;
            $gradient: linear-gradient(90deg, $red, $dark-teal);
            $gradient-reverse: linear-gradient(90deg, $dark-teal, $red);
            $text-color: #1a202c;
            $light-bg: #f7fafc;
            $border-color: rgba(0, 0, 0, 0.08);
            $transition-time: 0.3s;
            $easing: cubic-bezier(0.4, 0, 0.2, 1);
            $shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
            $shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
            $shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
            $radius-sm: 8px;
            $radius-md: 12px;
            $radius-lg: 16px;

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(5px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @mixin flex-center {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            @mixin hover-effect {
                transition: all $transition-time $easing;
                &:hover {
                    transform: translateY(-1px);
                    box-shadow: $shadow-md;
                }
            }

            @mixin button-style {
                @include flex-center;
                padding: 0.75rem 1.5rem;
                border-radius: $radius-md;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all $transition-time $easing;
            }

            @mixin icon-style {
                font-size: 1.15rem;
                line-height: 1;
                transition: all $transition-time $easing;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            :host {
                font-family:
                    'Inter',
                    -apple-system,
                    BlinkMacSystemFont,
                    sans-serif;
                --primary: #{$red};
                --primary-hover: #{darken($red, 8%)};
                --secondary: #{$dark-teal};
                --text: #{$text-color};
                --bg: #{$light-bg};
            }

            .layout-topbar {
                position: sticky;
                top: 0;
                z-index: 1200;
                height: 68px;
                background: white;
                box-shadow: $shadow-sm;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 1.5rem;
                transition: all $transition-time $easing;

                &-logo-container {
                    @include flex-center;
                    gap: 0.75rem;
                    margin-right: 2rem;
                    justify-content: flex-start;

                    .layout-topbar-logo {
                        display: flex;
                        align-items: center;

                        .redboost-logo {
                            height: 32px;
                            transition: all $transition-time $easing;

                            &:hover {
                                transform: scale(1.02);
                            }
                        }
                    }

                    .layout-menu-button {
                        @include flex-center;
                        @include icon-style;
                        background: none;
                        border: none;
                        color: $teal-1;
                        cursor: pointer;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        transition: all $transition-time $easing;

                        i {
                            font-size: 1.5rem;
                        }

                        &:hover {
                            background: rgba($teal-1, 0.08);
                            color: $teal-2;
                        }

                        &:focus {
                            outline: none;
                            box-shadow: 0 0 0 3px rgba($teal-1, 0.2);
                        }
                    }
                }

                &-actions {
                    @include flex-center;
                    gap: 1.25rem;
                    margin-left: auto;

                    .layout-config-menu {
                        .layout-topbar-action-highlight {
                            @include flex-center;
                            @include icon-style;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: $gradient;
                            color: white;
                            transition: all $transition-time $easing;

                            i {
                                font-size: 1.15rem;
                            }

                            &:hover {
                                box-shadow: $shadow-md;
                                transform: scale(1.05);
                            }
                        }
                    }

                    .join-now-button {
                        @include button-style;
                        background: $gradient;
                        color: white;
                        position: relative;
                        overflow: hidden;
                        padding: 0.65rem 1.25rem;

                        i {
                            @include icon-style;
                            font-size: 1rem;
                            margin-right: 0.5rem;
                        }

                        &:hover {
                            background: $gradient-reverse;
                            box-shadow: $shadow-md;
                        }

                        &:focus {
                            outline: none;
                            box-shadow: 0 0 0 3px rgba($red, 0.2);
                        }
                    }

                    .notification-container {
                        position: relative;
                        display: flex;
                        align-items: center;

                        .layout-topbar-action {
                            @include flex-center;
                            @include icon-style;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: $light-bg;
                            color: $teal-1;
                            transition: all $transition-time $easing;

                            i {
                                font-size: 1.15rem;
                            }

                            &:hover {
                                background: rgba($teal-1, 0.1);
                                transform: scale(1.05);
                            }
                        }

                        .notification-badge {
                            position: absolute;
                            top: -4px;
                            right: -4px;
                            background: $red;
                            color: white;
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            font-size: 0.7rem;
                            font-weight: 600;
                            @include flex-center;
                        }

                        .debug-count {
                            position: absolute;
                            top: 20px;
                            right: -20px;
                            color: $text-color;
                            font-size: 12px;
                            z-index: 1000;
                        }

                        .notification-dropdown {
                            position: absolute;
                            top: 50px;
                            right: 0;
                            background: white;
                            border-radius: $radius-md;
                            box-shadow: $shadow-md;
                            z-index: 2000;
                            width: 300px;
                            max-height: 400px;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            animation: fadeIn 0.3s $easing;

                            .dropdown-header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 15px;
                                border-bottom: 1px solid $border-color;
                                background: $light-bg;

                                h3 {
                                    margin: 0;
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: $dark-teal;
                                }

                                .close-btn,
                                .refresh-btn {
                                    background: none;
                                    border: none;
                                    font-size: 16px;
                                    cursor: pointer;
                                    color: $teal-1;
                                    transition: color 0.2s ease;
                                }

                                .refresh-btn {
                                    margin-right: 10px;
                                }

                                .close-btn:hover,
                                .refresh-btn:hover {
                                    color: $red;
                                }
                            }

                            .dropdown-body {
                                flex: 1;
                                overflow-y: auto;
                                padding: 10px;

                                .notification-item {
                                    padding: 12px;
                                    border-radius: $radius-sm;
                                    cursor: pointer;
                                    transition: background-color 0.2s ease;

                                    &:hover {
                                        background-color: rgba($teal-1, 0.05);
                                    }

                                    .notification-content {
                                        h4 {
                                            margin: 0;
                                            font-size: 16px;
                                            font-weight: 600;
                                            color: $dark-teal;
                                        }

                                        p {
                                            margin: 5px 0 0;
                                            font-size: 14px;
                                            color: lighten($text-color, 20%);
                                        }
                                    }
                                }

                                .no-notifications {
                                    text-align: center;
                                    color: $teal-1;
                                    margin: 20px 0;
                                    font-style: italic;
                                }
                            }
                        }
                    }

                    .profile-menu-container {
                        .profile-icon-container {
                            @include flex-center;
                            background: none;
                            border: none;
                            cursor: pointer;
                            width: 44px;
                            height: 44px;
                            border-radius: 50%;
                            transition: all $transition-time $easing;
                            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

                            &:hover {
                                transform: scale(1.05);
                                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                            }

                            &:focus {
                                outline: none;
                                box-shadow: 0 0 0 3px rgba($teal-1, 0.2);
                            }

                            .profile-picture {
                                width: 100%;
                                height: 100%;
                                border-radius: 50%;
                                object-fit: cover;
                                border: 2px solid $teal-1;
                                transition: all $transition-time $easing;
                            }

                            i {
                                @include icon-style;
                                font-size: 1.5rem;
                                color: $teal-1;
                            }
                        }
                    }

                    .layout-topbar-action {
                        @include flex-center;
                        @include icon-style;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: $light-bg;
                        color: $teal-1;
                        transition: all $transition-time $easing;

                        i {
                            font-size: 1.15rem;
                        }

                        &:hover {
                            background: rgba($teal-1, 0.1);
                            transform: scale(1.05);
                        }
                    }
                }
            }

            ::ng-deep .p-menu {
                border: none !important;
                border-radius: $radius-md !important;
                box-shadow: $shadow-md !important;
                padding: 0.5rem 0 !important;
                min-width: 200px !important;
                animation: fadeIn 0.3s $easing !important;
                background: white !important;

                .profile-menu-header {
                    padding: 0.75rem 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border-bottom: 1px solid $border-color;

                    .profile-icon-container {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: $light-bg;
                        @include flex-center;
                        border: 1px solid $border-color;

                        .profile-picture {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            border-radius: 50%;
                        }

                        i {
                            @include icon-style;
                            font-size: 1.3rem;
                            color: $text-color;
                        }
                    }

                    .profile-info {
                        .profile-name {
                            font-weight: 500;
                            font-size: 0.9rem;
                            color: $text-color;
                        }

                        .profile-role {
                            font-size: 0.75rem;
                            color: lighten($text-color, 20%);
                            text-transform: capitalize;
                        }
                    }
                }

                .p-menuitem {
                    margin: 0;
                    animation: slideIn 0.3s $easing;

                    .p-menuitem-link {
                        padding: 0.5rem 1rem !important;
                        color: $text-color !important;
                        border-radius: 0 !important;
                        transition: all $transition-time $easing !important;

                        &:hover {
                            background: rgba(0, 0, 0, 0.05) !important;
                            transform: translateX(3px);
                        }

                        .p-menuitem-icon {
                            @include icon-style;
                            color: $text-color !important;
                            margin-right: 0.5rem !important;
                            font-size: 0.95rem !important;
                        }

                        .p-menuitem-text {
                            font-weight: 400 !important;
                            font-size: 0.85rem !important;
                        }
                    }

                    &.p-menuitem-active {
                        .p-menuitem-link {
                            background: rgba(0, 0, 0, 0.1) !important;
                            color: $text-color !important;
                        }
                    }
                }

                .p-menu-separator {
                    margin: 0.25rem 0;
                    border-top: 1px solid $border-color !important;
                }
            }

            ::ng-deep .p-dialog.profile-dialog {
                border-radius: $radius-lg !important;
                box-shadow: $shadow-lg !important;
                border: none !important;
                z-index: 1300 !important;

                .p-dialog-header {
                    background: $gradient !important;
                    color: white !important;
                    padding: 1.25rem !important;
                    border-bottom: none !important;

                    .p-dialog-title {
                        font-weight: 600 !important;
                        font-size: 1.25rem !important;
                    }

                    .p-dialog-header-icon {
                        color: white !important;
                        transition: all $transition-time $easing !important;

                        &:hover {
                            background: rgba(white, 0.15) !important;
                        }
                    }
                }

                .p-dialog-content {
                    padding: 0 !important;
                    background: $light-bg !important;
                }
            }

            .dialog-content {
                padding: 1.5rem;
                max-height: 80vh;
                overflow-y: auto;

                .filter-bar {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;

                    .filter-btn {
                        padding: 0.5rem 1rem;
                        border-radius: $radius-sm;
                        background: none;
                        border: 1px solid $border-color;
                        font-weight: 500;
                        color: $text-color;
                        cursor: pointer;
                        transition: all $transition-time $easing;

                        &.active {
                            background: $gradient !important;
                            color: white !important;
                            border-color: transparent !important;
                        }

                        &:hover {
                            border-color: $red;
                            color: $red;
                        }
                    }
                }

                .card {
                    background: white;
                    border-radius: $radius-md;
                    box-shadow: $shadow-sm;
                    margin-bottom: 1.5rem;
                    overflow: hidden;

                    &.animate-card {
                        animation: fadeIn 0.4s $easing;
                    }

                    .card-header {
                        padding: 1rem;
                        border-bottom: 1px solid $border-color;

                        h3 {
                            margin: 0;
                            font-size: 1.1rem;
                            font-weight: 600;
                            color: $dark-teal;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                        }
                    }

                    .card-content {
                        padding: 1rem;

                        .form-group {
                            margin-bottom: 1rem;

                            label {
                                display: block;
                                margin-bottom: 0.5rem;
                                font-weight: 500;
                                color: $dark-teal;
                            }

                            input,
                            textarea {
                                width: 100%;
                                padding: 0.75rem;
                                border: 1px solid $border-color;
                                border-radius: $radius-sm;
                                font-family: inherit;
                                transition: all $transition-time $easing;

                                &:focus {
                                    outline: none;
                                    border-color: $red;
                                    box-shadow: 0 0 0 3px rgba($red, 0.1);
                                }
                            }

                            textarea {
                                min-height: 100px;
                                resize: vertical;
                            }

                            .chip-container {
                                display: flex;
                                flex-wrap: wrap;
                                gap: 0.5rem;
                                margin-top: 0.5rem;

                                .p-chip {
                                    background: $teal-1;
                                    color: white;
                                    border-radius: $radius-sm;
                                    padding: 0.25rem 0.75rem;
                                    font-size: 0.85rem;

                                    .p-chip-remove-icon {
                                        color: white;
                                        margin-left: 0.5rem;
                                        cursor: pointer;
                                    }
                                }
                            }
                        }
                    }
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.5rem;

                    button {
                        @include button-style;

                        &.save-btn {
                            background: $gradient;
                            color: white;

                            &:hover {
                                background: $gradient-reverse;
                                box-shadow: $shadow-md;
                            }

                            &:disabled {
                                background: $border-color;
                                color: $teal-2;
                                cursor: not-allowed;
                            }
                        }

                        &.cancel-btn {
                            background: none;
                            border: 1px solid $border-color;
                            color: $teal-1;

                            &:hover {
                                border-color: $red;
                                color: $red;
                            }
                        }
                    }
                }
            }

            @media (max-width: 992px) {
                .layout-topbar {
                    padding: 0 1rem;

                    &-logo-container {
                        gap: 0.5rem;
                    }

                    &-actions {
                        gap: 0.75rem;

                        .join-now-button {
                            padding: 0.5rem 1rem;

                            span {
                                display: none;
                            }

                            i {
                                margin-right: 0;
                            }
                        }
                    }
                }
            }

            @media (max-width: 768px) {
                .layout-topbar {
                    height: 60px;

                    &-logo-container {
                        .redboost-logo {
                            height: 28px;
                        }

                        .layout-menu-button {
                            width: 36px;
                            height: 36px;

                            i {
                                font-size: 1.25rem;
                            }
                        }
                    }

                    &-actions {
                        .profile-menu-container {
                            .profile-icon-container {
                                width: 40px;
                                height: 40px;
                            }
                        }
                    }

                    ::ng-deep .profile-dialog {
                        width: 95vw !important;

                        .dialog-content {
                            padding: 1rem;
                        }
                    }
                }
            }

            @media (max-width: 576px) {
                .layout-topbar {
                    &-logo-container {
                        .layout-menu-button {
                            width: 36px;
                            height: 36px;

                            i {
                                font-size: 1.15rem;
                            }
                        }
                    }

                    &-actions {
                        .layout-config-menu {
                            display: none;
                        }
                    }
                }

                ::ng-deep .profile-dialog {
                    .dialog-content {
                        .filter-bar {
                            flex-direction: column;
                            gap: 0.5rem;
                        }

                        .form-actions {
                            flex-direction: column;

                            button {
                                width: 100%;
                            }
                        }
                    }
                }
            }
        `
    ]
})
export class AppTopbar implements OnInit, OnDestroy {
    items!: MenuItem[];
    joinableRendezVous: RendezVousDTO | null = null;
    userId: number | null = null;
    userRole: string | null = null;
    user: any = null;
    unreadMessageCount: number = 0;
    showNotificationDropdown: boolean = false;
    notificationItems: NotificationItem[] = [];
    profileItems: MenuItem[] = [];
    settingsVisible: boolean = false;
    profileForm: FormGroup;
    isSubmitting: boolean = false;
    activeFilter: string = 'all';
    skills: string[] = [];
    expertise: string[] = [];
    skillInput: string = '';
    expertiseInput: string = '';
    private intervalId: any;
    private subscriptions: Subscription[] = [];

    @ViewChild('profileMenu') profileMenu!: Menu;

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
        private router: Router,
        private rendezVousService: RendezVousService,
        private userService: UserService,
        private notificationService: NotificationService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.profileForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            bio: ['', [Validators.maxLength(500)]],
            linkedin: ['', [Validators.pattern('https?://(www.)?linkedin.com/.*')]],
            facebook: ['', [Validators.pattern('https?://(www.)?facebook.com/.*')]],
            instagram: ['', [Validators.pattern('https?://(www.)?instagram.com/.*')]],
            yearsOfExperience: ['', [Validators.min(0)]],
            startupName: [''],
            industry: [''],
            skills: [''],
            expertise: ['']
        });
    }

    ngOnInit(): void {
        console.log('AppTopbar ngOnInit called');
        this.initProfileMenu();

        this.subscriptions.push(
            this.authService.getCurrentUser().subscribe((user) => {
                if (user) {
                    this.userId = user.id;
                    this.userRole = user.role;
                    this.user = user;
                    console.log('AppTopbar initialized with userId:', this.userId);
                    this.initProfileForm();
                    this.checkJoinableRendezVous();
                    this.intervalId = setInterval(() => this.checkJoinableRendezVous(), 30000);
                    this.notificationService.initialize(this.userId);
                    this.notificationService.updateUnreadMessageCount();
                    this.subscriptions.push(
                        this.notificationService.getUnreadMessageCount().subscribe((count) => {
                            console.log('AppTopbar received unread message count:', count);
                            this.unreadMessageCount = count;
                            this.fetchNotificationItems();
                            this.cdr.detectChanges();
                            console.log('Change detection triggered, unreadMessageCount:', this.unreadMessageCount);
                            const badge = document.querySelector('.notification-badge');
                            console.log('Notification badge in DOM:', badge ? badge.outerHTML : 'Not found');
                        })
                    );
                } else {
                    console.warn('No user logged in');
                    this.unreadMessageCount = 0;
                    this.cdr.detectChanges();
                }
            })
        );

        this.subscriptions.push(
            this.userService.user$.subscribe((user) => {
                this.user = user;
                if (user) {
                    this.initProfileForm();
                }
                this.cdr.detectChanges();
            })
        );
    }

    ngOnDestroy(): void {
        console.log('AppTopbar ngOnDestroy called');
        if (this.intervalId) clearInterval(this.intervalId);
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    initProfileMenu(): void {
        this.profileItems = [
            {
                label: 'View Profile',
                icon: 'pi pi-user',
                command: () => this.router.navigate(['/profile'])
            },
            {
                label: 'Edit Profile',
                icon: 'pi pi-pen',
                command: () => this.showSettings()
            },
            {
                separator: true
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => this.logout()
            }
        ];
    }

  initProfileForm(): void {
    this.skills = this.user?.skills
        ? this.user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : [];
    this.expertise = this.user?.expertise
        ? this.user.expertise.split(',').map((s: string) => s.trim()).filter((s: string) => s)
        : [];
    this.profileForm.patchValue({
        email: this.user?.email || '',
        phone: this.user?.phoneNumber || '',
        bio: this.user?.bio || '',
        linkedin: this.user?.linkedinUrl || '',
        facebook: this.user?.facebookUrl || '',
        instagram: this.user?.instagramUrl || '',
        yearsOfExperience: this.user?.yearsOfExperience || '',
        startupName: this.user?.startupName || '',
        industry: this.user?.industry || '',
        skills: this.skills.join(',') || '',
        expertise: this.expertise.join(',') || ''
    }, { emitEvent: false }); // Prevent unnecessary form events
    console.log('initProfileForm - Form values:', this.profileForm.value); // Debug
    console.log('initProfileForm - Skills array:', this.skills); // Debug
    console.log('initProfileForm - Expertise array:', this.expertise); // Debug
}

   addSkill(event: KeyboardEvent | Event): void {
    if ((event instanceof KeyboardEvent && event.key === 'Enter') || !(event instanceof KeyboardEvent)) {
        if (!this.skillInput.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Empty Input',
                detail: 'Please enter a skill.'
            });
            return;
        }
        if (this.skills.length >= 10) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Limit Reached',
                detail: 'You can add up to 10 skills.'
            });
            return;
        }
        const newSkill = this.skillInput.trim();
        if (newSkill.length > 50) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Skill',
                detail: 'Each skill must be 50 characters or less.'
            });
            return;
        }
        if (this.skills.includes(newSkill)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Skill',
                detail: 'This skill is already added.'
            });
            return;
        }
        this.skills = [...this.skills, newSkill]; // Create new array to trigger change detection
        this.profileForm.patchValue({ skills: this.skills.join(',') }, { emitEvent: false });
        this.skillInput = '';
      
        this.cdr.markForCheck();
    }
}

addExpertise(event: KeyboardEvent | Event): void {
    if ((event instanceof KeyboardEvent && event.key === 'Enter') || !(event instanceof KeyboardEvent)) {
        if (!this.expertiseInput.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Empty Input',
                detail: 'Please enter an expertise.'
            });
            return;
        }
        if (this.expertise.length >= 5) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Limit Reached',
                detail: 'You can add up to 5 expertise areas.'
            });
            return;
        }
        const newExpertise = this.expertiseInput.trim();
        if (newExpertise.length > 50) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Expertise',
                detail: 'Each expertise must be 50 characters or less.'
            });
            return;
        }
        if (this.expertise.includes(newExpertise)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Duplicate Expertise',
                detail: 'This expertise is already added.'
            });
            return;
        }
        this.expertise = [...this.expertise, newExpertise]; // Create new array to trigger change detection
        this.profileForm.patchValue({ expertise: this.expertise.join(',') }, { emitEvent: false });
        this.expertiseInput = '';
      
        this.cdr.markForCheck();
    }
}

    removeSkill(skill: string): void {
        this.skills = this.skills.filter((s) => s !== skill);
        this.profileForm.patchValue({ skills: this.skills.join(',') });
        this.cdr.detectChanges();
    }


    removeExpertise(expertise: string): void {
        this.expertise = this.expertise.filter((e) => e !== expertise);
        this.profileForm.patchValue({ expertise: this.expertise.join(',') });
        this.cdr.detectChanges();
    }

  updateProfile(): void {
    if (this.profileForm.valid && this.userId) {
        this.isSubmitting = true;
        const formData = this.profileForm.value;
        const formatUrl = (url: string) => {
            if (!url) return null;
            return url.startsWith('http') ? url : `https://${url}`;
        };
        const updatePayload = {
            email: formData.email,
            phoneNumber: formData.phone,
            bio: formData.bio,
            linkedinUrl: formatUrl(formData.linkedin), // Fixed field name
            facebookUrl: formatUrl(formData.facebook), // Fixed field name
            instagramUrl: formatUrl(formData.instagram), // Fixed field name
            ...(this.userRole === 'COACH' && {
                yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : null,
                skills: formData.skills || null, // Use formData.skills directly
                expertise: formData.expertise || null // Use formData.expertise directly
            }),
            ...(this.userRole === 'ENTREPRENEUR' && {
                startupName: formData.startupName,
                industry: formData.industry
            })
        };
        console.log('Update profile payload:', updatePayload); // Debug
        this.http.patch('http://localhost:8085/users/updateprofile', updatePayload).subscribe({
            next: (response: any) => {
                console.log('Profile update response:', response); // Debug
                this.user = {
                    ...this.user,
                    email: updatePayload.email,
                    phoneNumber: updatePayload.phoneNumber,
                    bio: updatePayload.bio,
                    facebookUrl: updatePayload.facebookUrl,
                    instagramUrl: updatePayload.instagramUrl,
                    linkedinUrl: updatePayload.linkedinUrl,
                    ...(this.userRole === 'COACH' && {
                        yearsOfExperience: updatePayload.yearsOfExperience,
                        skills: updatePayload.skills,
                        expertise: updatePayload.expertise
                    }),
                    ...(this.userRole === 'ENTREPRENEUR' && {
                        startupName: updatePayload.startupName,
                        industry: updatePayload.industry
                    })
                };
                console.log('Updated user object:', this.user); // Debug
                this.userService.setUser(this.user);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Profile updated successfully'
                });
                this.settingsVisible = false;
                this.isSubmitting = false;
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate(['/profile']);
                });
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error updating profile:', error); // Debug
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update profile: ' + (error.error?.message || 'Please try again.')
                });
                this.isSubmitting = false;
                this.cdr.detectChanges();
            }
        });
    } else {
        console.warn('Form is invalid or userId missing:', this.profileForm.errors, this.userId); // Debug
    }
}

    showSettings(): void {
        console.log('showSettings called');
        this.settingsVisible = true;
        this.activeFilter = 'all';
        this.profileMenu.hide(); // Close the profile menu
        this.cdr.detectChanges(); // Force change detection
    }

    setFilter(filter: string): void {
        this.activeFilter = filter;
        this.cdr.detectChanges();
    }

    checkJoinableRendezVous(): void {
    if (!this.userId || !this.userRole) {
        console.log('No user ID or role, skipping joinable rendezvous check');
        this.joinableRendezVous = null;
        this.cdr.detectChanges();
        return;
    }

    // Only check for COACH or ENTREPRENEUR roles
    if (this.userRole !== 'COACH' && this.userRole !== 'ENTREPRENEUR') {
        console.log(`User role ${this.userRole} is not eligible for joinable rendezvous`);
        this.joinableRendezVous = null;
        this.cdr.detectChanges();
        return;
    }

    const serviceCall = this.userRole === 'ENTREPRENEUR' 
        ? this.rendezVousService.getJoinableRendezVousForEntrepreneur(this.userId) 
        : this.rendezVousService.getJoinableRendezVousForCoach(this.userId);

    this.subscriptions.push(
        serviceCall.subscribe({
            next: (data: RendezVousDTO) => {
                console.log('Joinable rendezvous found:', data);
                this.joinableRendezVous = data;
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.warn('Error checking joinable rendezvous:', error);
                if (error.status === 204 || error.status === 404) {
                    this.joinableRendezVous = null;
                } else {
                    console.error('Unexpected error:', error);
                }
                this.cdr.detectChanges();
            }
        })
    );
}

    joinMeeting(meetingLink: string): void {
        window.open(meetingLink, '_blank');
    }

    logout(): void {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/landing']),
            error: (error) => {
                console.error('Logout failed:', error);
                this.router.navigate(['/landing']);
            }
        });
    }

    toggleNotificationDropdown(event: Event): void {
        event.stopPropagation();
        this.showNotificationDropdown = !this.showNotificationDropdown;
        if (this.showNotificationDropdown) {
            this.fetchNotificationItems();
        }
    }

    toggleProfileMenu(event: Event): void {
        if (this.profileMenu) this.profileMenu.toggle(event);
    }

    fetchNotificationItems(): void {
        if (!this.userId) {
            console.error('Cannot fetch notification items: No user ID');
            return;
        }

        this.http.get<ConversationDTO[]>('http://localhost:8085/api/conversations').subscribe({
            next: (conversations) => {
                console.log('Conversations fetched:', conversations);
                Promise.all(
                    conversations.map(async (conv) => {
                        try {
                            const unreadCount = await this.http.get<number>(`http://localhost:8085/api/messages/unread/count/${conv.id}?userId=${this.userId}`).toPromise();
                            if (unreadCount === 0) return null;

                            let name = '';
                            if (conv.estGroupe) {
                                name = conv.titre || 'Groupe sans nom';
                            } else {
                                const otherUserId = conv.participantIds.find((id) => id !== this.userId);
                                if (otherUserId) {
                                    try {
                                        const user = await this.http.get<any>(`http://localhost:8085/users/${otherUserId}`).toPromise();
                                        name = `${user.firstName} ${user.lastName}`.trim();
                                    } catch {
                                        name = 'Utilisateur inconnu';
                                    }
                                } else {
                                    name = 'Conversation inconnue';
                                }
                            }

                            return {
                                conversationId: conv.id,
                                name,
                                unreadCount,
                                isGroup: conv.estGroupe
                            };
                        } catch (err) {
                            console.error(`Error fetching unread count for conversation ${conv.id}:`, err);
                            return null;
                        }
                    })
                ).then((items) => {
                    this.notificationItems = items.filter((item) => item !== null) as NotificationItem[];
                    console.log('Notification items updated:', this.notificationItems);
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                console.error('Error fetching conversations:', err);
                this.notificationItems = [];
                this.cdr.detectChanges();
            }
        });
    }

    navigateToConversation(conversationId: number): void {
        this.router.navigate(['/gestion_comm'], { queryParams: { conversationId } });
        this.showNotificationDropdown = false;
    }

    refreshNotifications(): void {
        console.log('Refreshing notifications');
        this.notificationService.updateUnreadMessageCount();
        this.fetchNotificationItems();
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.notification-container')) {
            this.showNotificationDropdown = false;
            this.cdr.detectChanges();
        }
    }
}