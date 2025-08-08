import { promises as fs } from 'fs';
import path from 'path';

const dbFile = path.join(process.cwd(), 'data', 'reservations-rest.json');

async function initializeDb() {
  try {
    await fs.access(dbFile);
  } catch (error) {
    console.log(`Archivo ${dbFile} no encontrado, creándolo...`);
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    await fs.writeFile(dbFile, JSON.stringify([]));
  }
}

export async function GET() {
  try {
    console.log('Intentando leer desde:', dbFile);
    await initializeDb();
    const data = await fs.readFile(dbFile, 'utf8');
    const reservations = JSON.parse(data);
    return Response.json(reservations);
  } catch (error) {
    console.error('Error en GET /api/reservations-rest:', error);
    return new Response(JSON.stringify({ error: 'Error al leer las reservas', details: error.message }), {
      status: 500,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tableId, customerName, num, phone, startTime, endTime, status } = body;

    if (!tableId || !customerName || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), { status: 400 });
    }

    if (num <= 0) {
      return new Response(JSON.stringify({ error: 'El número de personas debe ser mayor a 0' }), { status: 400 });
    }

    if (!['confirmed', 'pending', 'cancelled'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Estado inválido' }), { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return new Response(JSON.stringify({ error: 'La hora de inicio debe ser anterior a la hora de fin' }), { status: 400 });
    }

    await initializeDb();
    const data = await fs.readFile(dbFile, 'utf8');
    const reservations = JSON.parse(data);

    const hasConflict = reservations.some((reservation) => {
      if (reservation.tableId !== tableId || reservation.status === 'cancelled') return false;
      const existingStart = new Date(reservation.startTime);
      const existingEnd = new Date(reservation.endTime);
      return (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      );
    });

    if (hasConflict) {
      return new Response(JSON.stringify({ error: 'Ya existe una reserva en ese horario para esta mesa' }), {
        status: 409,
      });
    }

    const newId = reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1;

    const newReservation = {
      id: newId,
      tableId,
      customerName: customerName.trim(),
      num,
      phone,
      startTime,
      endTime,
      status,
    };

    reservations.push(newReservation);
    await fs.writeFile(dbFile, JSON.stringify(reservations, null, 2));

    return new Response(JSON.stringify(newReservation), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/reservations-rest:', error);
    return new Response(JSON.stringify({ error: 'Error al agregar la reserva', details: error.message }), {
      status: 500,
    });
  }
}
