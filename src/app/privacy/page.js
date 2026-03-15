export const metadata = {
  title: "Política de Privacidad | Auto Directo",
  description: "Política de privacidad de Auto Directo",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: 14 de marzo de 2026</p>

      <section className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Información que recopilamos</h2>
          <p>
            Cuando usted nos contacta a través de WhatsApp u otros canales de comunicación,
            recopilamos su número de teléfono, nombre (si lo proporciona) y el contenido
            de sus mensajes con el fin de brindarle atención comercial relacionada con la
            compra y venta de vehículos.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Uso de la información</h2>
          <p>
            La información recopilada se utiliza exclusivamente para:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Responder sus consultas sobre vehículos disponibles.</li>
            <li>Coordinar visitas, pruebas de manejo y procesos de compra.</li>
            <li>Mejorar la calidad de nuestro servicio al cliente.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Compartir información con terceros</h2>
          <p>
            No vendemos, arrendamos ni compartimos su información personal con terceros,
            salvo cuando sea estrictamente necesario para cumplir con obligaciones legales
            o para procesar transacciones solicitadas por usted.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Seguridad de los datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas razonables para
            proteger su información personal contra acceso no autorizado, pérdida o
            divulgación.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Retención de datos</h2>
          <p>
            Conservamos sus datos de conversación por un período máximo de 12 meses,
            después de lo cual son eliminados de nuestros sistemas.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Sus derechos</h2>
          <p>
            Usted tiene derecho a solicitar el acceso, corrección o eliminación de sus
            datos personales. Para ejercer estos derechos, contáctenos en:
          </p>
          <p className="mt-2 font-medium">contacto@autodirecto.cl</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Contacto</h2>
          <p>
            Si tiene preguntas sobre esta política de privacidad, puede contactarnos a
            través de nuestro sitio web{" "}
            <a href="https://autodirecto.cl/contacto" className="text-blue-600 underline">
              autodirecto.cl/contacto
            </a>{" "}
            o directamente a contacto@autodirecto.cl.
          </p>
        </div>
      </section>
    </main>
  );
}
