import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterAppointments',
  standalone: true
})
export class FilterAppointmentsPipe implements PipeTransform {

  transform(appointments: any[], search: string): any[] {
    if (!appointments || !search) return appointments;

    search = search.toLowerCase();

    return appointments.filter(a =>
      a.patient?.first_name?.toLowerCase().includes(search) ||
      a.patient?.last_name?.toLowerCase().includes(search) ||
      a.patient?.dni?.includes(search)
    );
  }
}
