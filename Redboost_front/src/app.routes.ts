import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Landing } from './app/pages/frontoffice/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { GestionReclamationComponent } from './app/pages/frontoffice/gestion_reclamation/gestion-reclamation/gestion-reclamation.component';
import { MessagerieReclamationComponent } from './app/pages/frontoffice/gestion_reclamation/messagerie-reclamation/messagerie-reclamation.component';
import { PhaseListComponent } from './app/pages/frontoffice/gestion_accompagnement/phases/phase-list/phase-list.component';
import { KanbanBoardComponent } from './app/pages/frontoffice/gestion_accompagnement/kanban-board/kanban-board.component';
import { SigninComponent } from './app/pages/frontoffice/gestion_user/auth/signin/signin.component';
import { SignUpComponent } from './app/pages/frontoffice/gestion_user/auth/signup/signup.component';
import { ConfirmEmailComponent } from './app/pages/frontoffice/gestion_user/auth/confirm-email/confirm-email.component';
import { MarketplaceComponent } from './app/pages/frontoffice/marketplace/marketplace';
import { AppointmentsReceivedComponent } from './app/pages/frontoffice/gestion_rendez-vous/AppointmentsReceived/appointments-received.component';
import { AddProjetComponent } from './app/pages/frontoffice/gestion_startup/addprojet/addprojet.component';
import { AfficheProjetComponent } from './app/pages/frontoffice/gestion_startup/affiche-projet/affiche-projet.component';
import { DetailsProjetComponent } from './app/pages/frontoffice/gestion_startup/details-projet/details-projet.component';
import { UserProfileComponent } from './app/pages/frontoffice/gestion_user/profile/profile.component';
import { DocumentsComponent } from './app/pages/frontoffice/documents/documents.component';
import { ContactLandingComponent } from './app/pages/frontoffice/landing/components/contact-landing';
import { MarketLandingComponent } from './app/pages/frontoffice/landing/components/market-landing';
import { CoachRequestComponent } from './app/pages/backoffice/become_coach/coachrequest';
import { AllCoachRequestsComponent } from './app/pages/backoffice/become_coach/all-coach-requests.component';
import { AllReclamationsComponent } from './app/pages/frontoffice/gestion_reclamation/all-reclamations/all-reclamations.component';
import { InvestorDashboardComponent } from './app/pages/dashboard/inverstdashboard/investor-dashboard';
import { RoleGuard } from './role.guard';
import { DashboardRedirectComponent } from './app/pages/dashboard/dashboard-redirect/dashboard-redirect.component';
import { UnderConstructionComponent } from './app/pages/under-construction.component';
import { AppointmentListComponent } from './app/pages/frontoffice/gestion_rendez-vous/appointment-list/appointment-list.component';
import { ForgotPasswordComponent } from './app/pages/frontoffice/gestion_user/forgotpassword/forgotpassword.component';
import { ResetPasswordComponent } from './app/pages/frontoffice/gestion_user/reset-password/reset-password.component';
import { ChatComponent } from './app/pages/frontoffice/gestion_messagerie/chat/chat.component';
import { GestionCommunicationComponent } from './app/pages/frontoffice/gestion_messagerie/gestion-communication/gestion-communication.component';
import { MeetingDetailsPopupComponent } from './app/pages/frontoffice/gestion_rendez-vous/meeting-detail-popup/meeting-detail-popup.component';
import { MeetingListComponent } from './app/pages/frontoffice/gestion_rendez-vous/meetinglist/meeting-list.component';
import { UserListComponent } from './app/pages/backoffice/allUsers/user-list.component';
import { BinomeCoachRequestComponent } from './app/pages/backoffice/become_coach/binome_coach_request';
import { StaffTypeListComponent } from './app/pages/backoffice/database_management/staff-type-list/staff-type-list.component';
import { StaffTypeDetailComponent } from './app/pages/backoffice/database_management/staff-type-detail/staff-type-detail.component';
import { StaffFilterComponent } from './app/pages/backoffice/database_management/staff-filter/staff-filter.component';
import { ResourcesLandingComponent } from './app/pages/frontoffice/resourses-landing/ResourcesLandingComponent';
import { ResourcesComponent } from './app/pages/frontoffice/landing/components/resources.component';
import { KanbanActivityComponent } from './app/pages/backoffice/gestion_programmes/kanban-activity/kanban-activity.component';
import { ProgramMonitoringComponent } from './app/pages/backoffice/gestion_programmes/program-monitoring/program-monitoring.component';
import { ProgramDetailComponent } from './app/pages/backoffice/gestion_programmes/program-details/program-details.component';
import { ShowProduitsComponent } from './app/pages/frontoffice/gestion_startup/Produit/show-produits/show-produits.component';
import { ShowServicePComponent } from './app/pages/frontoffice/gestion_startup/ServiceP/show-service-p/show-service-p.component';
import { EvaluationFormComponent } from './app/pages/frontoffice/evaluation-form/evaluation-form.component';
import { DashboardComponent } from './app/pages/dashboard/dashboard/dashboard.component';
import { AboutComponent } from './app/pages/apropos/about';
import { ServicesComponent } from './app/pages/servicePage/services.component';
import { FeedbackPageComponent } from './app/pages/frontoffice/FeedbackPageComponent/feedback-popup.component';
import { AssignCoachComponent } from './app/pages/backoffice/assign-coach/assign-coach.component';



export const pagesRoutes: Routes = [
    { path: 'about', component: AboutComponent }, // Public route
    { path: 'Assign-coach', component: AssignCoachComponent },
    { path: 'feedback', component: FeedbackPageComponent }, // Public route
    { path: 'services', component: ServicesComponent },
    { path: 'addprojet', component: AddProjetComponent },
    { path: 'GetProjet', component: AfficheProjetComponent },
    { path: 'details-projet/:id', component: DetailsProjetComponent },
    { path: 'details-projet/:id/ShowProd', component: ShowProduitsComponent },
    { path: 'details-projet/:id/ShowService', component: ShowServicePComponent },
    { path: 'gestion-reclamation', component: GestionReclamationComponent },
    { path: 'marketplace', component: MarketplaceComponent },
{
    path: 'appointments',
    component: AppointmentListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ENTREPRENEUR'] } // Only ENTREPRENEUR role allowed
  },   
{
    path: 'appointments/received',
    component: AppointmentsReceivedComponent,
    canActivate: [RoleGuard],
    data: { roles: ['COACH'] } // Only COACH role allowed
  },
  
  { path: 'profile', component: UserProfileComponent },
    { path: 'projects/:projectId/documents', component: DocumentsComponent },
    { path: 'marketlanding', component: MarketLandingComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'gestion_comm', component: GestionCommunicationComponent },
    { path: 'meeting-list', component: MeetingListComponent },
    { path: 'meeting-details-popup', component: MeetingDetailsPopupComponent },
    { path: 'all-users', component: UserListComponent },
    { path: 'staff-types', component: StaffTypeListComponent },
    { path: 'staff-types/:id', component: StaffTypeDetailComponent },
    { path: 'staff-filter', component: StaffFilterComponent },
    { path: 'evaluation', component: EvaluationFormComponent },
    { path: 'Dash', component: DashboardComponent },
    { path: 'all-resourses', component: ResourcesLandingComponent },

    {
        path: 'Activities',
        children: [{ path: ':activityId', component: KanbanActivityComponent }]
    },
    { path: 'ProgramMonitoring', component: ProgramMonitoringComponent },
    { path: 'programs/:id', component: ProgramDetailComponent },

    { path: 'customers', loadChildren: () => import('./app/pages/backoffice/customers/customers.routes') },
    { path: 'services', loadChildren: () => import('./app/pages/backoffice/services/services.routes') },
    { path: 'inv', loadChildren: () => import('./app/pages/backoffice/invoices/invoice-quotations.routes') }
];

export const appRoutes: Routes = [
    { path: '', component: Landing },
    { path: 'coach-request', component: CoachRequestComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'contactlanding', component: ContactLandingComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'confirm-email', component: ConfirmEmailComponent },
    { path: 'resources', component: ResourcesComponent },
    { path: 'binome-coach-request', component: BinomeCoachRequestComponent },
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                canActivate: [RoleGuard],
                component: DashboardRedirectComponent
            },

            {
                path: 'entrepreneur-dashboard',
                canActivate: [RoleGuard],
                data: { expectedRole: 'ENTREPRENEUR' },
                component: UnderConstructionComponent
            },
            {
                path: 'investor-dashboard',
                canActivate: [RoleGuard],
                data: { expectedRole: 'INVESTOR' },
                component: UnderConstructionComponent
            },
            { path: 'profile', component: UserProfileComponent },
            { path: 'messagerie-reclamation', component: MessagerieReclamationComponent },
            { path: 'all-coach-requests', component: AllCoachRequestsComponent },
            { path: 'all-reclamations', component: AllReclamationsComponent },
            {
                path: 'phases',
                children: [
                    { path: '', component: PhaseListComponent },
                    { path: ':phaseId', component: KanbanBoardComponent }
                ]
            },
            { path: 'investor/v1', loadChildren: () => import('./app/pages/frontoffice/startup/investorStartups/investor.routes') },
            { path: 'startup/v1', loadChildren: () => import('./app/pages/frontoffice/startup/StartupsRequest/startup.routes') },
            { path: 'startup/:id', loadChildren: () => import('./app/pages/frontoffice/marketplace/StartupDetails/startup.routes') },
            { path: 'startup-details/:id', loadChildren: () => import('./app/pages/frontoffice/startup/DetailsInvestment/details.routes') },
            ...pagesRoutes
        ]
    },
    { path: '', component: Landing },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: 'notfound' }
];
