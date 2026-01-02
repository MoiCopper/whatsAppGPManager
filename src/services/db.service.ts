import { promises as fs } from 'fs';
import path from 'path';
import { DB, Group, Member } from '../interfaces/db.interface';

export class DBService {
    private dbPath: string;
    private db: DB;
    private isInitialized: boolean = false;

    constructor(dbPath?: string) {
        // Usa o caminho fornecido ou o padrão relativo ao projeto
        if (dbPath) {
            this.dbPath = dbPath;
        } else {
            // Sempre usa process.cwd() que aponta para a raiz do projeto
            // Tanto em desenvolvimento (tsx) quanto em produção (node dist/index.js)
            this.dbPath = path.join(process.cwd(), 'db', 'db.json');
        }
        this.db = { groups: {} };
    }

    /**
     * Inicializa o serviço carregando os dados do arquivo
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // console.log('Loading DB from:', this.dbPath);
            const data = await fs.readFile(this.dbPath, 'utf-8');
            
            // Remove BOM se existir
            const cleanData = data.replace(/^\uFEFF/, '');
            
            // Verifica se o arquivo não está vazio
            if (!cleanData.trim()) {
                console.warn('DB file is empty, initializing with empty structure');
                this.db = { groups: {} };
                await this.persist();
                this.isInitialized = true;
                return;
            }
            
            const parsed = JSON.parse(cleanData);
            // console.log('Parsed data keys:', Object.keys(parsed));
            // console.log('Parsed groups type:', typeof parsed.groups);
            // console.log('Parsed groups is array?', Array.isArray(parsed.groups));
            
            // Valida a estrutura
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid JSON structure: root is not an object');
            }
            
            // Garante que groups existe e é um objeto
            // IMPORTANTE: Não sobrescrever se groups já existe e é válido
            if (!parsed.groups) {
                console.warn('No groups property found, initializing empty groups');
                parsed.groups = {};
            } else if (Array.isArray(parsed.groups)) {
                console.warn('Groups is an array (should be object), converting...');
                // Se for array, converte para objeto vazio (ou pode fazer conversão se necessário)
                parsed.groups = {};
            } else if (typeof parsed.groups !== 'object') {
                console.warn('Groups is not an object, initializing empty groups');
                parsed.groups = {};
            }
            
            // Log detalhado antes da atribuição
            const groupsKeys = Object.keys(parsed.groups);
            // console.log('Groups keys before assignment:', groupsKeys);
            // console.log('Groups count before assignment:', groupsKeys.length);
            // console.log('Sample group data:', parsed.groups[groupsKeys[0]] ? Object.keys(parsed.groups[groupsKeys[0]]) : 'none');
            
            // Salva uma referência direta antes de atribuir
            const groupsToAssign = parsed.groups;
            const groupsKeysBefore = Object.keys(groupsToAssign);
            // console.log('groupsToAssign keys:', groupsKeysBefore);
            // console.log('groupsToAssign sample:', groupsToAssign[groupsKeysBefore[0]]);
            
            // Limpa o db atual primeiro
            this.db = { groups: {} };
            
            // Atribui diretamente ao objeto groups
            this.db.groups = groupsToAssign;
            
            // Verifica imediatamente após atribuição
            const groupsKeysAfter = Object.keys(this.db.groups);
            // console.log('groupsKeysAfter:', groupsKeysAfter);
            
            if (groupsKeysAfter.length === 0 && groupsKeysBefore.length > 0) {
                console.error('CRITICAL: Groups lost during assignment!');
                console.error('groupsToAssign type:', typeof groupsToAssign);
                console.error('groupsToAssign:', JSON.stringify(groupsToAssign).substring(0, 200));
                // Tenta atribuir propriedade por propriedade
                for (const key in groupsToAssign) {
                    if (groupsToAssign.hasOwnProperty(key)) {
                        this.db.groups[key] = groupsToAssign[key];
                    }
                }
                // console.log('After manual copy - Groups count:', Object.keys(this.db.groups).length);
            }
            
            // Verifica se a atribuição funcionou
            const assignedKeys = Object.keys(this.db.groups);
            // console.log('After assignment - Groups count:', assignedKeys.length);
            // console.log('After assignment - Groups keys:', assignedKeys);
            // console.log('First group ID:', assignedKeys[0] || 'none');
            
            // Verificação adicional
            if (assignedKeys.length === 0 && groupsKeys.length > 0) {
                console.error('ERROR: Groups were lost during assignment!');
                console.error('Original groups:', parsed.groups);
                console.error('Assigned groups:', this.db.groups);
                // Tenta recuperar
                this.db.groups = parsed.groups;
                // console.log('Recovered groups count:', Object.keys(this.db.groups).length);
            }
            
            // Converter datas de string para Date quando necessário
            this.parseDates();
            
            // console.log('DB initialized successfully. Groups:', Object.keys(this.db.groups).length);

        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // Arquivo não existe, cria um novo
                // console.log('DB file not found, creating new one');
                await this.persist();
            } else {
                console.error('Error initializing DB:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                });
                // Em caso de erro, inicializa com estrutura vazia
                this.db = { groups: {} };
                await this.persist();
            }
        }
        
        this.isInitialized = true;
    }

    /**
     * Converte strings de data para objetos Date
     */
    private parseDates(): void {
        Object.values(this.db.groups).forEach(group => {
            Object.values(group.members).forEach(member => {
                if (member.currentPunishment) {
                    if (typeof member.currentPunishment.appliedAt === 'string') {
                        member.currentPunishment.appliedAt = new Date(member.currentPunishment.appliedAt);
                    }
                    if (member.currentPunishment.expiresAt && typeof member.currentPunishment.expiresAt === 'string') {
                        member.currentPunishment.expiresAt = new Date(member.currentPunishment.expiresAt);
                    }
                }
            });
        });
    }

    /**
     * Persiste os dados no arquivo JSON
     */
    private async persist(): Promise<void> {
        // Garante que o diretório existe
        const dir = path.dirname(this.dbPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Escreve o arquivo
        await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 4), 'utf-8');
    }

    /**
     * 1. Registra um novo grupo
     */
    async registerGroup(group: Group): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.db.groups[group.id] = group;
        await this.persist();
    }

    /**
     * 2. Atualiza um grupo existente
     */
    async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.db.groups[groupId]) {
            throw new Error(`Group with id ${groupId} not found`);
        }

        this.db.groups[groupId] = {
            ...this.db.groups[groupId],
            ...updates
        };
        
        await this.persist();
    }

    async groupExists(groupId: string): Promise<boolean> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const group = this.db.groups[groupId];

        return !!group;
    }

    /**
     * 3. Cria um novo membro em um grupo
     */
    async createMember(groupId: string, member: Partial<Member>): Promise<Member> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const newMember: Member = {
            id: member.id as string,
            name: member.name as string,
            isAdmin: member.isAdmin as boolean,
            punishments: {
                timeout: 0,
                mute: 0,
                ban: 0,
                kick: 0,
                warn: 0,
                note: '',
            },
            menssagesIds: [],
            numberOfMessages: 1
        };

        if (!this.db.groups[groupId]) {
            throw new Error(`Group with id ${groupId} not found`);
        }

        this.db.groups[groupId].members[member.id as string] = newMember as Member;
        await this.persist();

        return this.db.groups[groupId].members[member.id as string];
    }

    /**
     * 4. Atualiza um membro existente
     */
    async updateMember(groupId: string, memberId: string, updates: Partial<Member>): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.db.groups[groupId]) {
            throw new Error(`Group with id ${groupId} not found`);
        }

        if (!this.db.groups[groupId].members[memberId]) {
            throw new Error(`Member with id ${memberId} not found in group ${groupId}`);
        }

        this.db.groups[groupId].members[memberId] = {
            ...this.db.groups[groupId].members[memberId],
            ...updates
        };
        
        await this.persist();
    }

    /**
     * 5. Registra um novo messageId na lista de menssagesIds do membro
     */
    async registerMessageId(groupId: string, memberId: string, messageId: string): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.db.groups[groupId]) {
            throw new Error(`Group with id ${groupId} not found`);
        }

        if (!this.db.groups[groupId].members[memberId]) {
            throw new Error(`Member with id ${memberId} not found in group ${groupId}`);
        }

        const member = this.db.groups[groupId].members[memberId];
        
        // Adiciona o messageId se não existir
        if (!member.menssagesIds.includes(messageId)) {
            member.menssagesIds.push(messageId);
            member.numberOfMessages = member.menssagesIds.length;
            await this.persist();
        }
    }

    /**
     * 6. Aplica uma nova punição a um membro
     */
    async applyPunishment(
        groupId: string,
        memberId: string,
        type: 'timeout' | 'mute' | 'ban' | 'kick' | 'warn',
        duration: number,
        reason: string
    ): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.db.groups[groupId]) {
            throw new Error(`Group with id ${groupId} not found`);
        }

        if (!this.db.groups[groupId].members[memberId]) {
            throw new Error(`Member with id ${memberId} not found in group ${groupId}`);
        }

        const member = this.db.groups[groupId].members[memberId];
        const now = new Date();
        const expiresAt = duration > 0 ? new Date(now.getTime() + duration) : null;

        // Incrementa o contador da punição
        member.punishments[type] = (member.punishments[type] || 0) + 1;

        // Define a punição atual
        member.currentPunishment = {
            type,
            duration,
            reason,
            appliedAt: now,
            expiresAt
        };

        await this.persist();
    }

    /**
     * Obtém um grupo por ID
     */
    async getGroup(groupId: string): Promise<Group | undefined> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.db.groups[groupId];
    }

    /**
     * Obtém um membro por ID
     */
    async getMember(groupId: string, memberId: string): Promise<Member | undefined> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.db.groups[groupId]?.members[memberId];
    }

    /**
     * Busca o nome do usuário no banco de dados
     * @param groupId ID do grupo
     * @param memberId ID do membro
     * @param fallback Nome alternativo caso não encontre no banco (opcional)
     * @returns Nome do usuário do banco de dados ou fallback
     */
    async getUserName(groupId: string, memberId: string, fallback?: string): Promise<string> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const member = this.db.groups[groupId]?.members[memberId];
            
            if (member && member.name && member.name.trim() !== '') {
                return member.name;
            }
            
            // Se não encontrou ou nome está vazio, retorna fallback ou padrão
            return fallback || '[FULANO(A)]';
        } catch (error) {
            console.error(`Error getting user name for member ${memberId} in group ${groupId}:`, error);
            return fallback || '[FULANO(A)]';
        }
    }

    /**
     * Obtém todos os grupos
     */
    async getAllGroups(): Promise<{ [key: string]: Group }> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.db.groups;
    }
}

