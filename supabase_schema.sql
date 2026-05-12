-- SQL para criação das tabelas no Supabase

-- Tabela para configurações globais do app (Backup em nuvem)
-- Agora excluindo produtos, que possuem tabela própria
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Produtos (Relacional)
-- Colunas entre aspas para preservar o camelCase sincronizado com o frontend
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    "expiryDate" TEXT, 
    "costPrice" NUMERIC DEFAULT 0,
    "retailPrice" NUMERIC DEFAULT 0,
    "resalePrice" NUMERIC DEFAULT 0,
    "salePrice" NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    batches JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações garantindo que todas as colunas necessárias existam (caso a tabela já tenha sido criada)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.products ADD COLUMN "costPrice" NUMERIC DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column costPrice already exists';
    END;
    
    BEGIN
        ALTER TABLE public.products ADD COLUMN "retailPrice" NUMERIC DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column retailPrice already exists';
    END;
    
    BEGIN
        ALTER TABLE public.products ADD COLUMN "resalePrice" NUMERIC DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column resalePrice already exists';
    END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN "salePrice" NUMERIC DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column salePrice already exists';
    END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN "stock" INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column stock already exists';
    END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN "expiryDate" TEXT;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column expiryDate already exists';
    END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN batches JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'column batches already exists';
    END;
END $$;


-- Habilitar Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso total (ajustar para produção com Auth)
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
