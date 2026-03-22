import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-accesso-negato',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './accesso-negato.component.html',
  styleUrl: './accesso-negato.component.css',
})
export class AccessoNegatoComponent {
  readonly authService = inject(AuthService);
}
