import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Grade } from '../../models/grade';
import { AuthService } from '../../services/auth.service';
import { GradeService } from '../../services/grade.service';

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente.component.html',
  styleUrl: './docente.component.css',
})
export class DocenteComponent implements OnInit {
  private readonly gradeService = inject(GradeService);
  readonly authService = inject(AuthService);

  grades: Grade[] = [];
  loading = false;
  message = '';
  error = '';
  form = {
    studenteUsername: '',
    studenteNome: '',
    materia: '',
    voto: 6,
  };

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.loading = true;
    this.error = '';
    this.gradeService.getAllGrades().subscribe({
      next: (grades) => {
        this.grades = grades;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Impossibile caricare i voti.';
        this.loading = false;
      },
    });
  }

  submit(): void {
    this.loading = true;
    this.message = '';
    this.error = '';
    this.gradeService.addGrade(this.form).subscribe({
      next: (response) => {
        this.message = response.message;
        this.form = { studenteUsername: '', studenteNome: '', materia: '', voto: 6 };
        this.loadGrades();
      },
      error: (err) => {
        this.error = err.error?.error || 'Inserimento non riuscito.';
        this.loading = false;
      },
    });
  }
}
