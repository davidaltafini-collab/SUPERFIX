import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' })); 
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// === MIDDLEWARE ===
interface AuthRequest extends Request { user?: any; }

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Lipsă token" });

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (err) return res.status(403).json({ message: "Token invalid" });
        req.user = user;
        next();
    });
};

// === EMAIL CONFIG ===
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

const getHtmlEmail = (title: string, bodyContent: string) => `
<!DOCTYPE html><html><head><style>
    body { font-family: 'Verdana', sans-serif; background-color: #f0f0f0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 4px solid #000; box-shadow: 8px 8px 0 #000; }
    .header { background-color: #DC2626; padding: 25px; text-align: center; border-bottom: 4px solid #000; }
    .header h1 { color: #fff; margin: 0; font-family: 'Arial Black', sans-serif; font-style: italic; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 0 #000; font-size: 32px; }
    .content { padding: 30px; color: #000; font-size: 16px; line-height: 1.6; }
    .footer { background-color: #000; color: #FBBF24; padding: 15px; text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; }
</style></head><body>
  <div class="container">
    <div class="header"><h1>SUPERFIX</h1></div>
    <div class="content"><h2 style="text-transform: uppercase; border-bottom: 3px dashed #000;">${title}</h2>${bodyContent}</div>
    <div class="footer">&copy; 2026 SUPERFIX HQ • CONFIDENȚIAL</div>
  </div>
</body></html>`;

async function sendEmail(to: string, subject: string, title: string, htmlBody: string) {
    try {
        await transporter.sendMail({ from: `"SuperFix HQ" <${process.env.EMAIL_USER}>`, to, subject, html: getHtmlEmail(title, htmlBody) });
    } catch (error) { console.error("❌ Eroare Email:", error); }
}

// === AUTH ===
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (!admin || !await bcrypt.compare(password, admin.passwordHash)) return res.status(401).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
        res.json({ token, role: 'ADMIN' });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.post('/api/auth/hero-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hero = await prisma.hero.findUnique({ where: { username } });
        if (!hero || !await bcrypt.compare(password, hero.passwordHash)) return res.status(401).json({ message: "Date incorecte" });
        const token = jwt.sign({ id: hero.id, role: 'HERO', alias: hero.alias }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
        res.json({ token, role: 'HERO', heroId: hero.id });
    } catch (e) { res.status(500).json({ error: "Server error" }); }
});

// === PUBLIC: APLICAȚIE EROU ===
app.post('/api/apply-hero', async (req, res) => {
    try {
        const { name, email, phone, category } = req.body;
        await prisma.heroApplication.create({ data: { name, email, phone, category } });
        
        await sendEmail(process.env.EMAIL_USER as string, "📢 APLICAȚIE NOUĂ!", "DOSAR NOU", 
            `<p>Nume: ${name}<br>Spec: ${category}<br>Tel: ${phone}</p><p>Verifică în Admin!</p>`);
        
        await sendEmail(email, "✅ DOSAR PRIMIT", "CONFIRMARE", 
            `<p>Salut ${name}, am primit datele tale. Te vom contacta!</p>`);

        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: "Eroare aplicare" }); }
});

// === ADMIN API ===
app.get('/api/admin/applications', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });
    const apps = await prisma.heroApplication.findMany({ orderBy: { date: 'desc' } });
    res.json(apps);
});

app.delete('/api/admin/applications/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });
    try {
        await prisma.heroApplication.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Delete failed" }); }
});

// 3. Update Erou (Editare & Trust Factor)
app.put('/api/heroes/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });
    
    try {
        const dataToUpdate = { ...req.body };

        // Dacă s-a trimis o parolă nouă, o hash-uim
        if (dataToUpdate.password) {
            dataToUpdate.passwordHash = await bcrypt.hash(dataToUpdate.password, 10);
            delete dataToUpdate.password; // Nu salvăm parola plain text
        } else {
            // Dacă parola e goală sau nu e trimisă, nu o atingem
            delete dataToUpdate.password;
        }

        // Asigură-te că nu încercăm să updatăm câmpuri interzise
        delete dataToUpdate.id;
        delete dataToUpdate.reviews;
        delete dataToUpdate.requests;

        const updated = await prisma.hero.update({
            where: { id: req.params.id },
            data: dataToUpdate
        });
        res.json(updated);
    } catch (e) { 
        console.error("Update error:", e);
        res.status(500).json({ error: "Update failed" }); 
    }
});

// 4. Șterge Erou
app.delete('/api/heroes/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: "Forbidden" });
    try { await prisma.hero.delete({ where: { id: req.params.id } }); res.json({ success: true }); } 
    catch { res.status(500).json({ error: "Delete failed" }); }
});

// === EROI (CREATE CU EMAIL) ===
app.post('/api/heroes', authenticateToken, async (req, res) => {
    try {
        const { username, alias, password, email, ...rest } = req.body;
        const existing = await prisma.hero.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: "Username luat!" });
        
        // Parola default sau cea setată
        const plainPassword = password || "Hero123!";
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        
        // Setăm TrustFactor implicit la 50 dacă nu e specificat
        const trustFactor = rest.trustFactor || 50;

        await prisma.hero.create({
            data: { username, alias, passwordHash, email, trustFactor, missionsCompleted: 0, ...rest }
        });

        // 🔥 TRIMITE EMAIL CU CREDENȚIALE 🔥
        if (email) {
            await sendEmail(
                email, 
                "🎉 BINE AI VENIT ÎN SUPERFIX!", 
                "DOSAR APROBAT", 
                `<p>Salut <strong>${alias}</strong>,</p>
                 <p>Ai fost recrutat oficial! Iată datele tale de acces:</p>
                 <ul style="background: #eee; padding: 15px; border: 2px solid #000;">
                    <li><strong>Username:</strong> ${username}</li>
                    <li><strong>Parolă:</strong> ${plainPassword}</li>
                 </ul>
                 <p>Accesează Portalul Eroilor și începe treaba!</p>`
            );
        }

        res.json({ success: true });
    } catch { res.status(500).json({ error: "DB Error" }); }
});

app.get('/api/heroes', async (req, res) => {
    const heroes = await prisma.hero.findMany({ include: { reviews: true } });
    res.json(heroes);
});

app.get('/api/heroes/:id', async (req, res) => {
    const hero = await prisma.hero.findUnique({ where: { id: req.params.id }, include: { reviews: true } });
    res.json(hero || {});
});

// === MISIUNI ===
app.post('/api/request', async (req, res) => {
    const { heroId, clientName, clientPhone, clientEmail, description } = req.body;
    try {
        const request = await prisma.serviceRequest.create({
            data: { heroId, clientName, clientPhone, clientEmail, description, status: 'PENDING' }
        });
        const hero = await prisma.hero.findUnique({ where: { id: heroId } });
        if (hero?.email) sendEmail(hero.email, "⚠️ MISIUNE NOUĂ", "ALERTĂ", `<p>Client: ${clientName}<br>Descriere: ${description}</p>`);
        res.json({ success: true, id: request.id });
    } catch (e) { res.status(500).json({ error: "Request error" }); }
});

app.get('/api/request', authenticateToken, async (req, res) => {
    const requests = await prisma.serviceRequest.findMany({ orderBy: { date: 'desc' }, include: { hero: true } });
    res.json(requests);
});

app.get('/api/hero/my-missions', authenticateToken, async (req: any, res: Response) => {
    const heroId = req.user.id;
    const missions = await prisma.serviceRequest.findMany({ where: { heroId }, orderBy: { date: 'desc' }, include: { hero: true } });
    res.json(missions);
});

app.put('/api/missions/:id/status', authenticateToken, async (req: any, res: Response) => {
    const { status, photo } = req.body;
    const missionId = req.params.id;
    const heroId = req.user.id;
    try {
        const mission = await prisma.serviceRequest.findUnique({ where: { id: missionId } });
        if(status === 'ACCEPTED' && mission?.clientEmail) await sendEmail(mission.clientEmail, "✅ ACCEPTAT", "EROUL VINE", "Misiune confirmata");
        
        await prisma.serviceRequest.update({ 
            where: { id: missionId }, 
            data: { 
                status, 
                ...(status === 'IN_PROGRESS' ? { photoBefore: photo } : {}),
                ...(status === 'COMPLETED' ? { photoAfter: photo } : {})
            } 
        });
        if(status === 'COMPLETED') await prisma.hero.update({ where: { id: heroId }, data: { trustFactor: { increment: 5 }, missionsCompleted: { increment: 1 }}});
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Update error" }); }
});

app.post('/api/reviews', async (req, res) => {
    const { heroId, clientName, rating, comment } = req.body;
    try {
        await prisma.review.create({ data: { heroId, clientName, rating, comment, date: new Date() } });
        if (rating === 5) await prisma.hero.update({ where: { id: heroId }, data: { trustFactor: { increment: 2 } } });
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Review error" }); }
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend "TaskRabbit" rulează pe portul ${PORT}`);
});