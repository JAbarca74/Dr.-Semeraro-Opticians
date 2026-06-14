import { UserPlus } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const RegistroPage = () => (
  <Placeholder
    title="Crear cuenta de paciente"
    description="El registro de pacientes en línea estará disponible próximamente. Por ahora, la recepción de la óptica abre su expediente al agendar su primera cita."
    icon={UserPlus}
    features={[
      'Alta de expediente con datos de contacto',
      'Acceso al portal para verificar su receta',
      'Seguimiento del estado de sus lentes',
      'Recordatorios de cita por WhatsApp',
    ]}
  />
);
