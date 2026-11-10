export interface TicketData {
  nom: string;
  prenom: string;
  telephone: string;
  ville: string;
  passId: string;
  timestamp: string;
}

export async function generateTicketImage(data: TicketData): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1024;
  const height = 1024;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas 2d context');

  // 1. Load the official invitation image
  const baseImg = new Image();
  await new Promise<void>((resolve, reject) => {
    baseImg.onload = () => resolve();
    baseImg.onerror = () => reject(new Error('Failed to load invitation image'));
    baseImg.src = '/assets/aistudio/Image__5__1506d399.jpg';
  });

  // Draw the original invitation image
  ctx.drawImage(baseImg, 0, 0, width, height);

  const fullName = `${data.prenom.trim().toUpperCase()} ${data.nom.trim().toUpperCase()}`;

  // 2. Top-left VIP Accreditation Card (without QR code, clean and perfectly aligned)
  const badgeX = 65;
  const badgeY = 60;
  const badgeWidth = 440;
  const badgeHeight = 114;

  // Background shadow & card fill
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 16);
  ctx.fill();
  ctx.restore();

  // Orange outer border
  ctx.strokeStyle = '#FF7900';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 16);
  ctx.stroke();

  // Left vertical orange accent strip
  ctx.fillStyle = '#FF7900';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 6, badgeHeight, [16, 0, 0, 16]);
  ctx.fill();

  // Text inside the badge
  const textX = badgeX + 26;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Eyebrow
  ctx.fillStyle = '#FF7900';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('★ INVITATION VIP NOMINATIVE ★', textX, badgeY + 28);

  // Attendee Full Name
  ctx.fillStyle = '#111827';
  ctx.font = '900 22px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(fullName, textX, badgeY + 56);

  // WhatsApp
  ctx.fillStyle = '#4B5563';
  ctx.font = '600 13.5px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '0px';
  ctx.fillText(`WhatsApp : ${data.telephone}`, textX, badgeY + 80);

  // Pass ID & City
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 12.5px monospace';
  ctx.fillText(`Pass N° : ${data.passId}  •  ${data.ville.toUpperCase()}`, textX, badgeY + 102);

  // 3. Official Verification Strip at bottom (y=860)
  const botBarY = 860;
  const botBarWidth = 580;
  const botBarHeight = 44;
  const botBarX = width / 2 - botBarWidth / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(botBarX, botBarY, botBarWidth, botBarHeight, 22);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 121, 0, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(botBarX, botBarY, botBarWidth, botBarHeight, 22);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(
    `PASS VALIDE POUR : ${fullName}  |  ${data.telephone}`,
    width / 2,
    botBarY + 27
  );

  return canvas.toDataURL('image/png');
}
