import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPatients',
  standalone: true,
})
export class FilterPatientsPipe implements PipeTransform {

  transform(patients: any[], search: string): any[] {
    if (!patients || !search) return patients;

    const term = search.toLowerCase();

    return patients.filter(p =>
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.dni.includes(term)
    );
  }
}
