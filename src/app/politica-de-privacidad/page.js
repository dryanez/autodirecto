import React from "react";

export const metadata = {
  title: "Política de Privacidad | Autodirecto",
  description: "Política de Privacidad y Tratamiento de Datos Personales de Autodirecto.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full bg-white p-8 md:p-12 shadow-sm rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <p className="mb-4">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CL')}
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Introducción</h2>
          <p className="mb-4">
            En <strong>Wiackowska Group Spa</strong> (operando bajo el nombre comercial <strong>Autodirecto</strong>), valoramos enormemente su privacidad. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información personal de los usuarios que visitan nuestro sitio web (autodirecto.cl) y utilizan nuestros servicios de consignación, venta y tasación de vehículos.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. Información que Recopilamos</h2>
          <p className="mb-4">
            Para brindarle nuestros servicios, podemos recopilar los siguientes tipos de información:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Datos de Identificación y Contacto:</strong> Nombre, RUT, correo electrónico, número de teléfono y dirección.</li>
            <li><strong>Información del Vehículo:</strong> Patente, marca, modelo, año, kilometraje, estado técnico y fotografías.</li>
            <li><strong>Datos de Navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas y cookies para mejorar la experiencia web.</li>
            <li><strong>Datos de Redes Sociales (Meta API):</strong> Si interactúa con nosotros mediante Facebook o Instagram, o si utilizamos herramientas de publicación autorizadas, procesaremos los datos en estricto cumplimiento con las normativas de Meta.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. Uso de la Información</h2>
          <p className="mb-4">
            Autodirecto utiliza sus datos personales exclusivamente para los siguientes fines:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Facilitar el proceso de tasación, consignación y venta de su vehículo.</li>
            <li>Crear perfiles de catálogo y publicarlos en nuestro sitio web y portales asociados (ej. ChileAutos).</li>
            <li>Gestionar las citas de inspección fotográfica y mecánica.</li>
            <li>Contactarle sobre el estado de su vehículo, ofertas de compra o información relevante.</li>
            <li>Cumplir con obligaciones legales, tributarias (DTE) y de transferencia vehicular.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Compartir Información con Terceros</h2>
          <p className="mb-4">
            No vendemos ni alquilamos su información personal. Solo compartimos sus datos con:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Proveedores de Servicios:</strong> Plataformas como Supabase (base de datos), Vercel (hosting) y Meta (para publicaciones y publicidad).</li>
            <li><strong>Plataformas Automotrices:</strong> Como ChileAutos, estrictamente cuando el cliente autorice la publicación de su vehículo.</li>
            <li><strong>Entidades Legales:</strong> Cuando sea requerido por la legislación chilena o para procesos de transferencia en el Registro Civil.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. Protección de sus Datos</h2>
          <p className="mb-4">
            Implementamos rigurosas medidas de seguridad técnicas y organizativas para proteger su información contra accesos no autorizados, alteración, divulgación o destrucción. 
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">6. Derechos del Usuario (Ley 19.628)</h2>
          <p className="mb-4">
            De acuerdo a la Ley sobre Protección de la Vida Privada de Chile, usted tiene derecho a:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Solicitar acceso a los datos personales que tenemos sobre usted.</li>
            <li>Solicitar la rectificación de datos inexactos.</li>
            <li>Solicitar la eliminación o cancelación de sus datos de nuestros registros (Derecho al Olvido), incluyendo solicitudes de eliminación de datos de Meta/Facebook (User Data Deletion).</li>
            <li>Oponerse al tratamiento de su información.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">7. Eliminación de Datos de Aplicaciones (Meta / Facebook)</h2>
          <p className="mb-4">
            Si usted ha concedido permisos a nuestra aplicación mediante el Inicio de Sesión de Facebook o Instagram, puede eliminar dichos permisos en cualquier momento desde la configuración de su cuenta de Facebook/Meta. Para solicitar la eliminación total de sus datos alojados en nuestros servidores, envíenos un correo a <strong>contacto@autodirecto.cl</strong> indicando su solicitud de "Eliminación de Datos".
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">8. Cambios a esta Política</h2>
          <p className="mb-4">
            Autodirecto se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación en esta página.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">9. Contacto</h2>
          <p className="mb-4">
            Si tiene alguna pregunta, inquietud o solicitud respecto a esta Política de Privacidad, no dude en contactarnos:
          </p>
          <p className="font-medium text-gray-800">
            Wiackowska Group Spa (Autodirecto)<br />
            Email: contacto@autodirecto.cl<br />
            Teléfono: +56 9 8625 3512<br />
            Dirección: Av. Providencia 123, Providencia, Santiago.
          </p>
        </div>
      </div>
    </div>
  );
}
