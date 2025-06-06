function openModal(imageUrl) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const downloadLink = document.getElementById("downloadLink");

  modal.style.display = "flex"; // Mostrar el modal
  modalImage.src = imageUrl; // Establecer la fuente de la imagen en el modal
  downloadLink.href = imageUrl; // Establecer el enlace de descarga a la URL de la imagen
}

// Función para cerrar el modal
function closeModal() {
  document.getElementById("imageModal").style.display = "none";
}
const inputField = document.getElementById('inputField');
const messages = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');

// Escapar caracteres HTML para evitar la ejecución de código HTML
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(char) {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

// Función para interpretar formato tipo Markdown
function parseMarkdown(text) {
  // Escapar caracteres HTML para evitar ejecución de código HTML
  text = escapeHTML(text);

  // Encabezados: soporta de # a ######
  text = text.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  text = text.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  text = text.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Línea horizontal (---)
  text = text.replace(/---/g, '<div class="separator"></div>');

  // Negrita y cursiva
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Negrita y cursiva
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Negrita
  text = text.replace(/_(.*?)_/g, '<em>$1</em>'); // Cursiva

  // Código inline `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bloque de código con ```
  text = text.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

  // Enlaces [texto](URL)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Lista desordenada ( - o *)
  text = text.replace(/(?:^|\n)[*-]\s?(.*)/g, function(match, p1) {
    return `<ul><li>${p1}</li></ul>`;
  });
  text = text.replace(/<\/ul>\s*<ul>/g, ''); // Combinar etiquetas <ul> adyacentes

  // Lista ordenada (1.)
  text = text.replace(/(?:^|\n)(\d+)\.\s?(.*)/g, function(match, p1, p2) {
    return `<ol><li>${p2}</li></ol>`;
  });
  text = text.replace(/<\/ol>\s*<ol>/g, ''); // Combinar etiquetas <ol> adyacentes

  // Saltos de línea
  text = text.replace(/\n/g, '<br>');

  // Renderizar expresiones matemáticas inline \( ... \) y display \[ ... \]
  text = text.replace(/\\\((.+?)\\\)/g, (_, expr) => {
    try {
      const cleanedExpr = expr
        .replace(/[VN]/g, '') // Quitar V y N
        .replace(/<br\s*\/?>/gi, '') // Quitar <br> como texto plano
        .trim();
      console.log('Representación de matemáticas en línea:', cleanedExpr);
      return katex.renderToString(cleanedExpr, { 
        throwOnError: false, 
        displayMode: false,
        output: 'html', // Asegurar salida HTML para renderizado limpio
        fleqn: false, // Desactivar alineación a la izquierda para centrar matemática inline
        minRuleThickness: 0.04 // Ajuste para mínimo grosor, reduciendo espacio
      });
    } catch (error) {
      console.error('Error al representar matemáticas en línea', expr, error);
      return `<span class="error">Error al renderizar matemáticas: ${escapeHTML(expr)}</span>`;
    }
  });

  text = text.replace(/\\\[(.+?)\\\]/g, (_, expr) => {
    try {
      const cleanedExpr = expr
        .replace(/[VN]/g, '') // Quitar V y N
        .replace(/<br\s*\/?>/gi, '') // Quitar <br> como texto plano
        .trim();
      console.log('Matemáticas de visualización de renderizado:', cleanedExpr);
      return `<div style="text-align:center; margin: 0.2em 0; padding: 0;">${katex.renderToString(cleanedExpr, { 
        throwOnError: false, 
        displayMode: true,
        output: 'html', // Asegurar salida HTML para renderizado limpio
        fleqn: false, // Desactivar alineación a la izquierda para centrar matemática display
        minRuleThickness: 0.04 // Ajuste para mínimo grosor, reduciendo espacio
      })}</div>`;
    } catch (error) {
      console.error('Error al representar las matemáticas de visualización:', expr, error);
      return `<div class="error">Error al renderizar matemáticas: ${escapeHTML(expr)}</div>`;
    }
  });

  return text;
}

// Manejar el mensaje del usuario
function handleUserMessage() {
  const userMessage = inputField.value;
  if (userMessage.trim() === "") return; // No enviar mensajes vacíos
  displayMessage(userMessage, 'user');
  inputField.value = '';
  fetchAssistantResponse(userMessage);
  document.getElementById('helpText').style.display = "none"
}

// Función para mostrar mensaje del usuario o asistente
function displayMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = sender === 'user' ? 'user-message' : 'assistant-message';
  messageDiv.innerHTML = parseMarkdown(text); // Usar parseMarkdown para permitir formato
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight; // Scroll hacia abajo
}

// Obtener respuesta del asistente (respuesta dummy por ahora)
// Obtener respuesta del asistente con mensaje de "por favor espere" para generación de imagen
async function fetchAssistantResponse(userMessage) {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'assistant-message';
  typingDiv.innerHTML = '<span class="typing">Escribiendo</span>';
  messages.appendChild(typingDiv);
  messages.scrollTop = messages.scrollHeight;

  // Verificar si el mensaje comienza con "/imagine"
  if (userMessage.startsWith("/imagine")) {
    // Extraer el prompt después del comando /imagine
    const prompt = userMessage.replace("/imagine", "").trim();
    if (prompt) {
      try {
        // Actualizar para mostrar mensaje de "por favor espere"
        typingDiv.innerHTML = '<span class="typing">Por favor espere mientras  genera su imagen</span>';

        // Generar URL de la imagen
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}/?nologo=1`;

        // Crear un elemento imagen y asignar evento onload para controlar mensaje "por favor espere"
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = prompt;
        image.style = "width: 80%; border-radius: 10px; margin-top: 15px;";

        image.onclick = function() {
          openModal(imageUrl); // Abrir el modal al hacer clic en la imagen
        };

        // Evento que se dispara sólo cuando la imagen carga completamente
        image.onload = function() {
          // Limpiar mensaje "por favor espere" después de cargar la imagen
          typingDiv.innerHTML = '';
          messages.appendChild(image);
          messages.scrollTop = messages.scrollHeight; // Scroll hacia abajo
        };

        // Agregar mensaje de carga al contenedor de mensajes
        messages.appendChild(image);
        messages.scrollTop = messages.scrollHeight; // Asegurar scroll hacia abajo
      } catch (error) {
        typingDiv.innerHTML = "<span class='typing'>Error: No se pudo conectar al servidor de imágenes.</span>";
      }
    } else {
      typingDiv.innerHTML = "<span class='typing'>Por favor, proporcione un mensaje después /imagine.</span>";
    }
  } else {
    // Manejar respuestas de texto normales
    const apiUrl = 'https://text.pollinations.ai/openai';
    const requestBody = {
      model: 'openai-gpt-3',
      messages: [{ role: 'user', content: userMessage }]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        // Parsear y mostrar la respuesta del asistente
        const formattedMessage = parseMarkdown(assistantMessage);
        typingDiv.innerHTML = ''; // Limpiar indicador de escritura
        const messageDiv = document.createElement('div');
        messageDiv.className = 'assistant-message';
        messageDiv.innerHTML = formattedMessage;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight; // Scroll hacia abajo
      } else {
        typingDiv.innerHTML = "<span class='typing'>Lo sentimos, no pude procesar tu solicitud.</span>";
      }
    } catch (error) {
      typingDiv.innerHTML = "<span class='typing'>Error: No se pudo conectar al servidor.</span>";
    }
  }
}

// Efecto de escritura para la ayuda
const text = "¿En qué te puedo ayudar?";
const speed = 50; // velocidad de escritura en milisegundos
let index = 0;

function typeWriter() {
  if (index < text.length) {
    document.getElementById("helpText").innerHTML += text.charAt(index);
    index++;
    setTimeout(typeWriter, speed);
  }
}

// Mostrar popup de información usando SweetAlert2
function showInfo() {
  Swal.fire({
      title: '¡Bienvenidos!',
      html: `
 <p style="color: #bbb; font-size: 1rem; line-height: 1.5;">
CAYEY es tu asistente virtual. Empieza aquí:
</p><br>
<ul style="color: #bbb; font-size: 0.9rem; line-height: 1.4; padding-left: 10px;text-align: justify">
<li><strong>/ imagine</strong>: Escribe esto seguido de una descripción para generar imágenes.</li><br>
<li><strong>Idiomas disponibles</strong>: Inglés, español, francés, alemán, italiano, portugués, neerlandés, ruso, chino (simplificado y tradicional), japonés, coreano, árabe, hindi, bengalí, turco.</li><br>
</ul>
<p style="color: #bbb; font-size: 1rem; line-height: 1.5;">
Usa el campo de texto en la parte inferior para escribir tus comandos o preguntas.
<br>
<br>
AUTOR: CAYEY
</p>
  `,
      icon: 'info',
      confirmButtonText: '¡Entendido!',
      background: '#212121',
      color: '#d1d5db',
      confirmButtonColor: '#333'
    })
    .then(() => {
      // Iniciar el efecto de escritura después que el usuario cierra la alerta informativa
      typeWriter();
    });
}
// Iniciar efecto de escritura cuando la página carga
window.onload = showInfo;

function confirmDeletion() {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esta acción!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrarlo!',
    cancelButtonText: 'No, Cancelar!',
    reverseButtons: true,
    background: '#212121', // Color de fondo
    color: '#d1d5db', // Color de texto
    confirmButtonColor: '#333', // Color del botón confirmar
    cancelButtonColor: '#d1d5db', // Color del botón cancelar
  }).then((result) => {
    if (result.isConfirmed) {
      // Si se clickea "Sí", recargar la página
      location.reload();
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Si se clickea "No", mostrar mensaje de cancelación con estilo personalizado
      Swal.fire({
        title: 'Cancelado',
        text: 'Tus mensajes están seguros.',
        icon: 'error',
        background: '#212121', // Color de fondo
        color: '#d1d5db', // Color de texto
        confirmButtonColor: '#333' // Color del botón confirmar
      });
    }
  });
}
