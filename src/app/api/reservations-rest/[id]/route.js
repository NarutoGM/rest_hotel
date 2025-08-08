import { promises as fs } from 'fs';
import path from 'path';

const dbFile = path.join(process.cwd(), 'data', 'reservations-rest.json');

async function initializeDb() {
  try {
    await fs.access(dbFile);
  } catch {
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    await fs.writeFile(dbFile, JSON.stringify([]));
  }
}

export async function PUT(request, { params }) {
  try {
    const idNumber = parseInt(params.id);
    if (isNaN(idNumber)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
    }

    const body = await request.json();
    const { tableId, customerName, num, phone, startTime, endTime, status } = body;
    const tableIdNum = parseInt(tableId);

    if (isNaN(tableIdNum) || !customerName || !startTime || !endTime) {
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
    let reservations = JSON.parse(data);

    const reservationIndex = reservations.findIndex((r) => r.id === idNumber);
    if (reservationIndex === -1) {
      return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
    }

    const hasConflict = reservations.some((r, index) => {
      if (
        index === reservationIndex ||
        r.tableId !== tableIdNum ||
        r.status === 'cancelled'
      ) {
        return false;
      }

      const existingStart = new Date(r.startTime);
      const existingEnd = new Date(r.endTime);

      return (
        (start >= existingStart && start < existingEnd) ||
        (end > existingStart && end <= existingEnd) ||
        (start <= existingStart && end >= existingEnd)
      );
    });

    if (hasConflict) {
      return new Response(JSON.stringify({ error: 'Ya existe una reserva en ese horario para esta mesa' }), { status: 409 });
    }

    reservations[reservationIndex] = {
      ...reservations[reservationIndex],
      tableId: tableIdNum,
      customerName: customerName.trim(),
      num,
      phone,
      startTime,
      endTime,
      status,
    };

    await fs.writeFile(dbFile, JSON.stringify(reservations, null, 2));
    return Response.json(reservations[reservationIndex]);
  } catch (error) {
    console.error('Error en PUT /api/reservations-rest:', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar la reserva', details: error.message }), {
      status: 500,
    });
  }
}

export async function DELETE(_, { params }) {
  try {
    const idNumber = parseInt(params.id);
    if (isNaN(idNumber)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });
    }

    await initializeDb();
    const data = await fs.readFile(dbFile, 'utf8');
    let reservations = JSON.parse(data);

    const exists = reservations.some((r) => r.id === idNumber);
    if (!exists) {
      return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
    }

    reservations = reservations.filter((r) => r.id !== idNumber);
    await fs.writeFile(dbFile, JSON.stringify(reservations, null, 2));

    return Response.json({ message: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error('Error en DELETE /api/reservations-rest:', error);
    return new Response(JSON.stringify({ error: 'Error al eliminar la reserva', details: error.message }), {
      status: 500,
    });
  }
}
