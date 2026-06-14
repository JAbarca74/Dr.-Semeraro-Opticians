import { Calendar } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const AgendaPage = () => (
  <Placeholder
    title="Agenda y citas"
    description="Calendario administrativo, bloques de disponibilidad del especialista y coordinación de citas con recordatorios."
    icon={Calendar}
    features={[
      'Bloques de disponibilidad por doctor y día',
      'Estados de cita: confirmada, pendiente, reprogramada y cancelada',
      'Recordatorios automáticos vía WhatsApp al paciente',
      'Vista semanal y diaria del consultorio',
      'Reasignación rápida de horarios',
      'Historial de cambios por cita',
    ]}
  />
);
