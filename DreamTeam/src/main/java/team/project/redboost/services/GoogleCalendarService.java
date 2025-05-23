package team.project.redboost.services;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.*;
import org.springframework.stereotype.Service;
import team.project.redboost.entities.RendezVous;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.StringReader;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleCalendarService {
    private static final String APPLICATION_NAME = "RedBoostCalendarIntegration";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR);
    private static final String ORGANIZER_EMAIL = "messaoudimarwa75@gmail.com";
    private static final String CENTRAL_CALENDAR_ID = "messaoudimarwa75@gmail.com";
    private static final String CLIENT_ID = "847579644213-tt8aljrm2luej8b38q16f7hdl99ssnl1.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "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";
    private static final String REFRESH_TOKEN = "1//04DE7uncFrquGCgYIARAAGAQSNwF-L9Ir3ZgwGmXhcd87TSMBrxA6N-O058uJc8u-1_2QPaa89LBNuyVX2Xp9jdpX8iKyxM2btrA";

    private Calendar calendarService;

    @PostConstruct
    public void init() throws GeneralSecurityException, IOException {
        System.out.println("Initialisation de GoogleCalendarService...");
        this.calendarService = getCalendarService();
        System.out.println("GoogleCalendarService initialisé avec succès");
    }

    public void ajouterRendezVous(RendezVous rendezVous) {
        try {
            System.out.println("Début de l'ajout dans Google Calendar");
            System.out.println("RendezVous ID: " + rendezVous.getId());

            Event event = new Event()
                    .setSummary(rendezVous.getTitle())
                    .setDescription(rendezVous.getDescription())
                    .setOrganizer(new Event.Organizer().setEmail(ORGANIZER_EMAIL));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime heure = LocalTime.parse(rendezVous.getHeure(), formatter);
            LocalDateTime startTime = LocalDateTime.of(rendezVous.getDate(), heure);
            LocalDateTime endTime = startTime.plusHours(1);
            DateTime startDateTime = new DateTime(startTime.atZone(ZoneId.of("Europe/Paris")).toInstant().toEpochMilli());
            EventDateTime start = new EventDateTime()
                    .setDateTime(startDateTime)
                    .setTimeZone("Europe/Paris");
            event.setStart(start);

            DateTime endDateTime = new DateTime(endTime.atZone(ZoneId.of("Europe/Paris")).toInstant().toEpochMilli());
            EventDateTime end = new EventDateTime()
                    .setDateTime(endDateTime)
                    .setTimeZone("Europe/Paris");
            event.setEnd(end);

            Event.Reminders reminders = new Event.Reminders()
                    .setUseDefault(false)
                    .setOverrides(Arrays.asList(
                            new EventReminder().setMethod("email").setMinutes(30),
                            new EventReminder().setMethod("email").setMinutes(10)
                    ));
            event.setReminders(reminders);

            List<EventAttendee> attendees = new ArrayList<>();
            if (rendezVous.getCoach() != null && rendezVous.getCoach().getEmail() != null) {
                System.out.println("Email du coach: " + rendezVous.getCoach().getEmail());
                attendees.add(new EventAttendee().setEmail(rendezVous.getCoach().getEmail()));
            } else {
                System.err.println("Email du coach non disponible pour le rendez-vous ID: " + rendezVous.getId());
            }

            if (rendezVous.getEntrepreneur() != null && rendezVous.getEntrepreneur().getEmail() != null) {
                System.out.println("Email de l'entrepreneur: " + rendezVous.getEntrepreneur().getEmail());
                attendees.add(new EventAttendee().setEmail(rendezVous.getEntrepreneur().getEmail()));
            } else {
                System.err.println("Email de l'entrepreneur non disponible pour le rendez-vous ID: " + rendezVous.getId());
                if (rendezVous.getEntrepreneur() == null) {
                    System.err.println("L'entité Entrepreneur est null pour ce rendez-vous.");
                } else {
                    System.err.println("L'email de l'Entrepreneur est null.");
                }
            }

            if (!attendees.isEmpty()) {
                event.setAttendees(attendees);
                System.out.println("Participants ajoutés à l'événement : " + attendees);
            } else {
                System.err.println("Aucun email valide trouvé pour les attendees de l'événement.");
            }

            ConferenceData conferenceData = new ConferenceData();
            CreateConferenceRequest createConferenceRequest = new CreateConferenceRequest();
            createConferenceRequest.setRequestId("random-string-" + System.currentTimeMillis());
            createConferenceRequest.setConferenceSolutionKey(new ConferenceSolutionKey().setType("hangoutsMeet"));
            conferenceData.setCreateRequest(createConferenceRequest);
            event.setConferenceData(conferenceData);

            event = calendarService.events().insert(CENTRAL_CALENDAR_ID, event)
                    .setConferenceDataVersion(1)
                    .setSendNotifications(true)
                    .execute();

            String meetingLink = null;
            if (event.getConferenceData() != null && event.getConferenceData().getEntryPoints() != null) {
                for (EntryPoint entryPoint : event.getConferenceData().getEntryPoints()) {
                    if ("video".equals(entryPoint.getEntryPointType())) {
                        meetingLink = entryPoint.getUri();
                        System.out.println("Lien Google Meet généré : " + meetingLink);
                        rendezVous.setMeetingLink(meetingLink);
                        break;
                    }
                }
            }

            if (meetingLink == null) {
                System.err.println("Aucun lien Google Meet n'a été généré.");
            }

            System.out.println("Événement créé avec succès: " + event.getHtmlLink());

        } catch (Exception e) {
            System.err.println("Erreur lors de l'ajout dans Google Calendar: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur calendrier: " + e.getClass().getName() + " - " + e.getMessage(), e);
        }
    }

    private Calendar getCalendarService() throws GeneralSecurityException, IOException {
        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY,
                new StringReader("{\"installed\":{\"client_id\":\"" + CLIENT_ID + "\",\"client_secret\":\"" + CLIENT_SECRET + "\"}}")
        );

        Credential credential = new GoogleCredential.Builder()
                .setClientSecrets(clientSecrets)
                .setJsonFactory(JSON_FACTORY)
                .setTransport(GoogleNetHttpTransport.newTrustedTransport())
                .build()
                .setRefreshToken(REFRESH_TOKEN);

        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Calendar.Builder(httpTransport, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }
}