repeat task.wait() until game:IsLoaded()
wait(1)

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local Lighting = game:GetService("Lighting")

local guiReady, PlayerGui = pcall(function()
    return LocalPlayer:WaitForChild("PlayerGui", 5)
end)

if not guiReady or not PlayerGui then
    warn("PlayerGui não foi carregado.")
    return
end

-- Criar GUI principal
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "MobileUI"
ScreenGui.ResetOnSpawn = false
ScreenGui.IgnoreGuiInset = true
ScreenGui.Parent = PlayerGui

-- Botão flutuante
local FloatButton = Instance.new("TextButton")
FloatButton.Size = UDim2.new(0, 50, 0, 50)
FloatButton.Position = UDim2.new(0, 20, 0.5, -45)
FloatButton.Text = "🡸"
FloatButton.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
FloatButton.TextColor3 = Color3.new(1, 1, 1)
FloatButton.Font = Enum.Font.GothamBold
FloatButton.TextScaled = true
FloatButton.BorderSizePixel = 0
FloatButton.Parent = ScreenGui

-- Frame com Scroll
local Panel = Instance.new("ScrollingFrame")
Panel.Size = UDim2.new(0, 250, 0, 300)
Panel.Position = UDim2.new(0, 80, 0.5, -150)
Panel.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
Panel.CanvasSize = UDim2.new(0, 0, 0, 0)
Panel.ScrollBarThickness = 6
Panel.ScrollingDirection = Enum.ScrollingDirection.Y
Panel.Visible = true
Panel.Parent = ScreenGui

Instance.new("UICorner", Panel)

local UIList = Instance.new("UIListLayout", Panel)
UIList.Padding = UDim.new(0, 5)

local function UpdateCanvas()
    task.wait()
    Panel.CanvasSize = UDim2.new(0, 0, 0, UIList.AbsoluteContentSize.Y + 10)
end
UIList:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(UpdateCanvas)

-- Sistema de Abas
local TabButtonsFrame = Instance.new("Frame")
TabButtonsFrame.Size = UDim2.new(0, 250, 0, 30)
TabButtonsFrame.Position = UDim2.new(0, 300, 0.5, -270)
TabButtonsFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
TabButtonsFrame.Parent = ScreenGui

local TabButtonsLayout = Instance.new("UIListLayout", TabButtonsFrame)
TabButtonsLayout.FillDirection = Enum.FillDirection.Horizontal
TabButtonsLayout.Padding = UDim.new(0, 0)

-- Dicionário para armazenar os frames de cada aba
local Tabs = {}
local CurrentTab = nil

-- Função para criar uma nova aba
function CreateTab(tabName)
    local TabButton = Instance.new("TextButton")
    TabButton.Size = UDim2.new(0.5, 0, 1, 0)
    TabButton.Text = tabName
    TabButton.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
    TabButton.TextColor3 = Color3.new(1, 1, 1)
    TabButton.Font = Enum.Font.Gotham
    TabButton.Parent = TabButtonsFrame
    
    local TabFrame = Instance.new("Frame")
    TabFrame.Size = UDim2.new(1, 0, 1, 0)
    TabFrame.BackgroundTransparency = 1
    TabFrame.Visible = false
    TabFrame.Parent = Panel
    
    Tabs[tabName] = {
        Button = TabButton,
        Frame = TabFrame,
        UIList = Instance.new("UIListLayout", TabFrame)
    }
    
    Tabs[tabName].UIList.Padding = UDim.new(0, 5)
    
    TabButton.MouseButton1Click:Connect(function()
        for name, tab in pairs(Tabs) do
            tab.Frame.Visible = (name == tabName)
            tab.Button.BackgroundColor3 = (name == tabName) and Color3.fromRGB(70, 70, 70) or Color3.fromRGB(50, 50, 50)
        end
        CurrentTab = tabName
    end)
    
    if not CurrentTab then
        CurrentTab = tabName
        TabButton.BackgroundColor3 = Color3.fromRGB(70, 70, 70)
        TabFrame.Visible = true
    end
    
    return TabFrame
end

-- Criar abas principais
CreateTab("Principal")
CreateTab("Teleportes")
CreateTab("NPCs")
CreateTab("Itens")
CreateTab("Visual")
CreateTab("Outros")

-- Função para criar botão em uma aba específica
function CriarBotao(tabName, nome, func)
    if not Tabs[tabName] then
        warn("Aba '"..tabName.."' não existe!")
        return
    end
    
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(1, -20, 0, 40)
    btn.Text = nome
    btn.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
    btn.TextColor3 = Color3.new(1, 1, 1)
    btn.Font = Enum.Font.Gotham
    btn.TextScaled = true
    btn.Parent = Tabs[tabName].Frame
    btn.MouseButton1Click:Connect(func)
end

-- Minimizar
local minimized = false
FloatButton.MouseButton1Click:Connect(function()
    minimized = not minimized
    Panel.Visible = not minimized
    TabButtonsFrame.Visible = not minimized
    FloatButton.Text = minimized and "🡺" or "🡸"
end)

-- ====== ORGANIZANDO OS BOTÕES NAS ABAS ======

-- ABA PRINCIPAL
CriarBotao("Principal", "🌞 Fullbright", function()
    Lighting.GlobalShadows = false
    Lighting.Brightness = 10
end)

CriarBotao("Principal", "Noclip", function()
    local Player = game.Players.LocalPlayer
    local Character = Player.Character or Player.CharacterAdded:Wait()

    local function Noclip()
        for _, part in pairs(Character:GetDescendants()) do
            if part:IsA("BasePart") and part.CanCollide then
                part.CanCollide = false
            end
        end
    end

    game:GetService("RunService").Stepped:Connect(Noclip)
end)

CriarBotao("Principal", "❌ Fechar", function()
    ScreenGui:Destroy()
end)

-- ABA TELEPORTES
CriarBotao("Teleportes", "tp end", function()
local config = {
    vezesTeleporte = 120,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,             -- Intervalo entre teleportes em segundos
    velocidade = 0,               -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-425, 28, -49041)
    }
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function()
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("auto kill final", function()
local caminhoNPCs = workspace.Baseplates.FinalBasePlate.OutlawBase.StandaloneZombiePart.Zombies
local ativo = false

-- VARIÁVEIS
local player = game:GetService("Players").LocalPlayer
local cam = workspace.CurrentCamera
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local cameraOriginalSubject = humanoid
local cameraOriginalType = Enum.CameraType.Custom

local listaNPCs = {}
local conexao

-- FUNÇÕES
local function resetarCamera()
    cam.CameraSubject = cameraOriginalSubject
    cam.CameraType = cameraOriginalType
end

function desligar()
    ativo = false
    if conexao then
        conexao:Disconnect()
        conexao = nil
    end
    resetarCamera()
    print("Desligado e câmera restaurada.")
end

local function seguirNPC(npc)
    local hum = npc:FindFirstChild("Humanoid")
    if not hum then return end

    cam.CameraSubject = hum
    cam.CameraType = Enum.CameraType.Custom

    conexao = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then
            desligar()
            return
        end

        if hum.Health <= 0 or not npc:IsDescendantOf(workspace) then
            conexao:Disconnect()
            conexao = nil
            task.wait(0.5)
            table.remove(listaNPCs, 1)
            if #listaNPCs > 0 then
                seguirNPC(listaNPCs[1])
            else
                desligar()
            end
        end
    end)
end

function ligar()
    if ativo then return end
    ativo = true

    listaNPCs = caminhoNPCs:GetChildren()
    if #listaNPCs > 0 then
        seguirNPC(listaNPCs[1])
        print("Ligado!")
    else
        warn("Nenhum NPC encontrado.")
        desligar()
    end
end

-- BOTÃO NA TELA
local gui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
gui.ResetOnSpawn = false

local botao = Instance.new("TextButton")
botao.Size = UDim2.new(0, 140, 0, 50)
botao.Position = UDim2.new(0, 10, 1, -60)
botao.Text = "Ativar"
botao.TextScaled = true
botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
botao.TextColor3 = Color3.new(1, 1, 1)
botao.Parent = gui

botao.MouseButton1Click:Connect(function()
    if ativo then
        desligar()
        botao.Text = "Ativar"
        botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
    else
        ligar()
        botao.Text = "Desligar"
        botao.BackgroundColor3 = Color3.fromRGB(200, 30, 30)
    end
end)
end)

CriarBotao("Teleportes", "TeslaLab", function()
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()

-- Configurações
local TOTAL_TELEPORTES = 30
local TELEPORTES_PARA_SENTAR = 15  -- Quando chegar no 15º teleporte, senta
local INTERVALO_TELEPORTES = 0.1

-- Verificação do personagem
repeat
    character = player.Character
    if not character then
        character = player.CharacterAdded:Wait()
    end
until character and character:FindFirstChild("HumanoidRootPart")

-- Função de teleporte (original)
local function teleportarParaTeslaLab()
    local teslaLab = workspace:FindFirstChild("TeslaLab")
    if not teslaLab then
        warn("TeslaLab não encontrado!")
        return false
    end

    local spawnPoint = teslaLab:FindFirstChild("SpawnPoint") or teslaLab:GetModelCFrame()
    local destino = typeof(spawnPoint) == "Instance" and spawnPoint.CFrame or spawnPoint
    
    character:SetPrimaryPartCFrame(destino + Vector3.new(0, 3, 0))
    return true
end

-- SEU SCRIPT ORIGINAL DE SENTAR (sem modificações)
local function sentarPersonagem()
    local maxDistance = 200

    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end

        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        seat:Sit(character:FindFirstChildOfClass("Humanoid"))
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Sistema principal de teleportes
for i = 1, TOTAL_TELEPORTES do
    teleportarParaTeslaLab()
    
    -- Ativa o seu script original no 15º teleporte
    if i == TELEPORTES_PARA_SENTAR then
        sentarPersonagem()  -- Chama sua função original sem modificações
    end
    
    task.wait(INTERVALO_TELEPORTES)
end

print("Processo completo! Total de teleportes: "..TOTAL_TELEPORTES)
end)

CriarBotao("Teleportes", "tp no trem", function()
local player = game.Players.LocalPlayer
local function teleportar()
	local character = player.Character or player.CharacterAdded:Wait()
	local hrp = character:WaitForChild("HumanoidRootPart")

	local seat = workspace:WaitForChild("Train"):WaitForChild("TrainControls")
		:WaitForChild("ConductorSeat"):WaitForChild("VehicleSeat")

	-- Teleporta o jogador um pouco acima do assento
	hrp.CFrame = seat.CFrame + Vector3.new(0, 3, 0)
end

-- Quando o personagem spawna, teleporta
if player.Character then
	teleportar()
end
player.CharacterAdded:Connect(teleportar)
end)

CriarBotao("Teleportes", "forte", function()
-- Serviços
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

-- Configurações
local player = Players.LocalPlayer
local VELOCIDADE = 1200
local ALTURA = 9
local POSICAO_INICIAL = Vector3.new(55, ALTURA, 29633)

-- Variáveis
local personagem
local rootPart
local movendo = true
local ultimoZ = POSICAO_INICIAL.Z
local brainJarDetectado = false

-- Prepara personagem com física correta
local function prepararPersonagem()
    personagem = player.Character or player.CharacterAdded:Wait()
    rootPart = personagem:WaitForChild("HumanoidRootPart")
    rootPart.Anchored = false
    rootPart.AssemblyLinearVelocity = Vector3.new()
    rootPart.AssemblyAngularVelocity = Vector3.new()
    rootPart.CFrame = CFrame.new(POSICAO_INICIAL)
    task.wait(0.5)
    ultimoZ = rootPart.Position.Z
end

-- Movimento contínuo
local function moverPersonagem()
    if movendo then
        ultimoZ = ultimoZ - VELOCIDADE * 0.02
        rootPart.CFrame = CFrame.new(rootPart.Position.X, ALTURA, ultimoZ)
    end
end

-- Sentar no assento mais próximo
local function sentarNoAssentoMaisProximo()
    local maxDistance = 1000
    local closestSeat = nil
    local shortestDistance = maxDistance

    for _, seat in ipairs(workspace:GetDescendants()) do
        if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
            local distance = (seat.Position - rootPart.Position).Magnitude
            if distance < shortestDistance then
                shortestDistance = distance
                closestSeat = seat
            end
        end
    end

    if closestSeat then
        personagem:MoveTo(closestSeat.Position)
        task.wait(0.5)
        closestSeat:Sit(personagem:FindFirstChildOfClass("Humanoid"))
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Retorna uma parte válida do modelo para usar como referência de posição
local function obterParteDoModel(model)
    if model:IsA("Model") then
        if model.PrimaryPart then
            return model.PrimaryPart
        else
            for _, parte in ipairs(model:GetDescendants()) do
                if parte:IsA("BasePart") then
                    return parte
                end
            end
        end
    end
    return nil
end

-- Verifica se BrainJar apareceu e está próximo
local function verificarBrainJar()
    if brainJarDetectado then return end
    local runtime = workspace:FindFirstChild("RuntimeItems")
    if runtime then
        local cannon = runtime:FindFirstChild("Cannon")
        local parteDoCannon = obterParteDoModel(cannon)

        if parteDoCannon then
            local distancia = (parteDoCannon.Position - rootPart.Position).Magnitude
            if distancia <= 300 then
                brainJarDetectado = true
                movendo = false
                sentarNoAssentoMaisProximo()
            end
        end
    end
end

-- Loop principal
local function iniciar()
    prepararPersonagem()

    local conexao
    conexao = RunService.Heartbeat:Connect(function()
        moverPersonagem()
        verificarBrainJar()
    end)

    personagem.Destroying:Connect(function()
        conexao:Disconnect()
    end)
end

-- Inicialização
player.CharacterAdded:Connect(iniciar)
if player.Character then iniciar() end

-- Tecla P para ativar/desativar movimento manualmente
UserInputService.InputBegan:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.P then
        movendo = not movendo
    end
end)
end)

CriarBotao("Teleportes", "castelo", function()
-- Serviços
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

-- Configurações
local player = Players.LocalPlayer
local VELOCIDADE = 1800
local ALTURA = 9
local POSICAO_INICIAL = Vector3.new(55, ALTURA, 29633)

-- Variáveis
local personagem
local rootPart
local movendo = true
local ultimoZ = POSICAO_INICIAL.Z
local brainJarDetectado = false

-- Prepara personagem com física correta
local function prepararPersonagem()
    personagem = player.Character or player.CharacterAdded:Wait()
    rootPart = personagem:WaitForChild("HumanoidRootPart")
    rootPart.Anchored = false
    rootPart.AssemblyLinearVelocity = Vector3.new()
    rootPart.AssemblyAngularVelocity = Vector3.new()
    rootPart.CFrame = CFrame.new(POSICAO_INICIAL)
    task.wait(0.5)
    ultimoZ = rootPart.Position.Z
end

-- Movimento contínuo
local function moverPersonagem()
    if movendo then
        ultimoZ = ultimoZ - VELOCIDADE * 0.02
        rootPart.CFrame = CFrame.new(rootPart.Position.X, ALTURA, ultimoZ)
    end
end

-- Sentar no assento mais próximo
local function sentarNoAssentoMaisProximo()
    local maxDistance = 1000
    local closestSeat = nil
    local shortestDistance = maxDistance

    for _, seat in ipairs(workspace:GetDescendants()) do
        if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
            local distance = (seat.Position - rootPart.Position).Magnitude
            if distance < shortestDistance then
                shortestDistance = distance
                closestSeat = seat
            end
        end
    end

    if closestSeat then
        personagem:MoveTo(closestSeat.Position)
        task.wait(0.5)
        closestSeat:Sit(personagem:FindFirstChildOfClass("Humanoid"))
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Retorna uma parte válida do modelo para usar como referência de posição
local function obterParteDoModel(model)
    if model:IsA("Model") then
        if model.PrimaryPart then
            return model.PrimaryPart
        else
            for _, parte in ipairs(model:GetDescendants()) do
                if parte:IsA("BasePart") then
                    return parte
                end
            end
        end
    end
    return nil
end

-- Verifica se BrainJar apareceu e está próximo
local function verificarBrainJar()
    if brainJarDetectado then return end
    local runtime = workspace:FindFirstChild("RuntimeItems")
    if runtime then
        local cannon = runtime:FindFirstChild("Vampire Knife")
        local parteDoCannon = obterParteDoModel(cannon)

        if parteDoCannon then
            local distancia = (parteDoCannon.Position - rootPart.Position).Magnitude
            if distancia <= 300 then
                brainJarDetectado = true
                movendo = false
                sentarNoAssentoMaisProximo()
            end
        end
    end
end

-- Loop principal
local function iniciar()
    prepararPersonagem()

    local conexao
    conexao = RunService.Heartbeat:Connect(function()
        moverPersonagem()
        verificarBrainJar()
    end)

    personagem.Destroying:Connect(function()
        conexao:Disconnect()
    end)
end

-- Inicialização
player.CharacterAdded:Connect(iniciar)
if player.Character then iniciar() end

-- Tecla P para ativar/desativar movimento manualmente
UserInputService.InputBegan:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.H then
        movendo = not movendo
    end
end)
end)

CriarBotao("Teleportes", "10 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(59, 10, 29892)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "20 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-152, 8, 19878)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "30 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-152, 8, 19878)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "40 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-582, 6, 34)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "50 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-177, 13, -9900)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "60 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(54, 13, -19817)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

CriarBotao("Teleportes", "70 m", function()
local config = {
    vezesTeleporte = 60,          -- Quantidade de vezes que vai teleportar por posição
    intervalo = 0,               -- Intervalo entre teleportes em segundos
    velocidade = 0,              -- 0 para teleporte instantâneo, >0 para movimento suave
    posicoes = {
        Vector3.new(-197, 9, -29738)
    },
    teleportesParaSentar = 30    -- Quantidade de teleportes antes de procurar assento
}

-- Função para mover/teleportar
local function moverParaPosicao(rootPart, destino)
    if config.velocidade > 0 then
        local distancia = (destino - rootPart.Position).Magnitude
        local duracao = distancia / config.velocidade
        local inicio = tick()
        local posInicial = rootPart.Position
        
        while tick() - inicio < duracao do
            local progresso = (tick() - inicio) / duracao
            rootPart.Position = posInicial:Lerp(destino, progresso)
            game:GetService("RunService").Heartbeat:Wait()
        end
    end
    rootPart.CFrame = CFrame.new(destino)
end

-- Função para encontrar e sentar no assento mais próximo
local function sentarNoAssentoMaisProximo(character)
    local maxDistance = 300
    
    local function getNearestSeat()
        local closestSeat = nil
        local shortestDistance = maxDistance

        for _, seat in ipairs(workspace:GetDescendants()) do
            if seat:IsA("Seat") or seat:IsA("VehicleSeat") then
                local distance = (seat.Position - character.HumanoidRootPart.Position).Magnitude
                if distance < shortestDistance then
                    shortestDistance = distance
                    closestSeat = seat
                end
            end
        end
        return closestSeat
    end

    local seat = getNearestSeat()
    if seat then
        character:MoveTo(seat.Position)
        task.wait(0.5)
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            seat:Sit(humanoid)
        end
    else
        warn("Nenhum assento próximo encontrado!")
    end
end

-- Função principal
local function iniciarTeleporte()
    local character = game.Players.LocalPlayer.Character
    if not character then return end
    
    local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoidRootPart then return end
    
    local teleportCount = 0
    
    for _, posicao in ipairs(config.posicoes) do
        for i = 1, config.vezesTeleporte do
            moverParaPosicao(humanoidRootPart, posicao)
            teleportCount = teleportCount + 1
            
            -- Verifica se atingiu o número de teleportes para sentar
            if teleportCount >= config.teleportesParaSentar then
                sentarNoAssentoMaisProximo(character)
                return  -- Encerra o teleporte após sentar
            end
            
            wait(config.intervalo)
        end
    end
end

-- Inicia o teleporte quando o personagem spawnar
game.Players.LocalPlayer.CharacterAdded:Connect(function(character)
    wait(1) -- Espera o personagem carregar completamente
    iniciarTeleporte()
end)

-- Se já tiver um personagem, inicia imediatamente
if game.Players.LocalPlayer.Character then
    iniciarTeleporte()
end
end)

-- ABA NPCS
CriarBotao("NPCs", "aimbot", function()
local camera = game.Workspace.CurrentCamera
local localplayer = game:GetService("Players").LocalPlayer

_G.aimbot = true

-- Variáveis para controle de NPCs
local caminhosNPCs = {}

local function tentarAdicionar(caminho)
    if caminho then
        table.insert(caminhosNPCs, caminho)
    end
end

local function encontrarNPCsVivos()
    caminhosNPCs = {}

    -- Adicionando possíveis caminhos para os NPCs
    tentarAdicionar(workspace:FindFirstChild("RuntimeEnemies"))
    tentarAdicionar(workspace:FindFirstChild("InimigosExtras"))
    tentarAdicionar(workspace:FindFirstChild("RuntimeItems"))

    local towns = workspace:FindFirstChild("Towns")
    if towns then
        local function getZombies(townName)
            local town = towns:FindFirstChild(townName)
            if town then
                local part = town:FindFirstChild("ZombiePart")
                if part then
                    return part:FindFirstChild("Zombies")
                end
            end
            return nil
        end

        tentarAdicionar(getZombies("LargeTownTemplate"))
        tentarAdicionar(getZombies("SmallTownTemplate"))
        tentarAdicionar(getZombies("MediumTownTemplate"))

        for _, cidade in pairs(towns:GetChildren()) do
            local part = cidade:FindFirstChild("ZombiePart")
            if part then
                local z = part:FindFirstChild("Zombies")
                if z then
                    tentarAdicionar(z)
                end
            end
        end
    end

    tentarAdicionar(
        workspace:FindFirstChild("Baseplates")
        and workspace.Baseplates:FindFirstChild("FinalBasePlate")
        and workspace.Baseplates.FinalBasePlate:FindFirstChild("OutlawBase")
        and workspace.Baseplates.FinalBasePlate.OutlawBase:FindFirstChild("StandaloneZombiePart")
        and workspace.Baseplates.FinalBasePlate.OutlawBase.StandaloneZombiePart:FindFirstChild("Zombies")
    )

    local vivos = {}
    for _, caminho in ipairs(caminhosNPCs) do
        if caminho and caminho:IsDescendantOf(workspace) then
            for _, npc in ipairs(caminho:GetChildren()) do
                local hum = npc:FindFirstChild("Humanoid")
                if hum and hum.Health > 0 then
                    table.insert(vivos, npc)
                end
            end
        end
    end
    return vivos
end

function closestNPC()
    local dist = math.huge
    local target = nil

    for _, npc in pairs(encontrarNPCsVivos()) do
        if npc and npc:FindFirstChild("Head") and localplayer.Character and localplayer.Character:FindFirstChild("Head") then
            local magnitude = (npc.Head.Position - localplayer.Character.Head.Position).magnitude
            if magnitude < dist then
                dist = magnitude
                target = npc
            end
        end
    end
    return target
end

game:GetService("RunService").RenderStepped:Connect(function()
    if _G.aimbot then
        local targetNPC = closestNPC()
        if targetNPC then
            camera.CFrame = CFrame.new(camera.CFrame.Position, targetNPC.Head.Position)
        end
    end
end)

-- Criando o botão na interface
local gui = Instance.new("ScreenGui", localplayer:WaitForChild("PlayerGui"))
gui.ResetOnSpawn = false
gui.Name = "NPCSeguidorGUI"

local botao = Instance.new("TextButton")
botao.Size = UDim2.new(0, 140, 0, 50)
botao.Position = UDim2.new(1, -160, 0, -30)
botao.Text = "Ativar"
botao.TextScaled = true
botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
botao.TextColor3 = Color3.new(1, 1, 1)
botao.Parent = gui

-- Lógica de arrastar o botão na tela (suporta dispositivo móvel)
local dragging, offset
botao.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        offset = input.Position - botao.AbsolutePosition
    end
end)

botao.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = false
    end
end)

game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.Touch then
        local newPos = input.Position - offset
        botao.Position = UDim2.new(0, newPos.X, 0, newPos.Y)
    end
end)

-- Alternar o aimbot ao clicar
botao.MouseButton1Click:Connect(function()
    _G.aimbot = not _G.aimbot
    botao.Text = _G.aimbot and "Desligar" or "Ativar"
    botao.BackgroundColor3 = _G.aimbot and Color3.fromRGB(200, 30, 30) or Color3.fromRGB(30, 200, 30)
end)
end)

CriarBotao("NPCs", "lock npc", function()
local caminhosNPCs = {}

local function tentarAdicionar(caminho)
    if caminho then
        table.insert(caminhosNPCs, caminho)
    end
end

-- VARIÁVEIS
local player = game:GetService("Players").LocalPlayer
local cam = workspace.CurrentCamera
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local cameraOriginalSubject = humanoid
local cameraOriginalType = Enum.CameraType.Custom

local ativo = false
local listaNPCs = {}
local conexao
local verificadorLoop

-- FUNÇÕES
local function resetarCamera()
    cam.CameraSubject = cameraOriginalSubject
    cam.CameraType = cameraOriginalType
end

local function desligar()
    ativo = false
    if conexao then
        conexao:Disconnect()
        conexao = nil
    end
    if verificadorLoop then
        verificadorLoop:Disconnect()
        verificadorLoop = nil
    end
    resetarCamera()
    print("Desligado e câmera restaurada.")
end

local function seguirNPC(npc)
    local hum = npc:FindFirstChild("Humanoid")
    if not hum then return end

    cam.CameraSubject = hum
    cam.CameraType = Enum.CameraType.Custom

    conexao = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then
            desligar()
            return
        end

        if hum.Health <= 0 or not npc:IsDescendantOf(workspace) then
            conexao:Disconnect()
            conexao = nil
            task.wait(0.5)
            table.remove(listaNPCs, 1)
            if #listaNPCs > 0 then
                seguirNPC(listaNPCs[1])
            else
                resetarCamera()
                print("Esperando novos NPCs vivos...")
            end
        end
    end)
end

local function encontrarNPCsVivos()
    caminhosNPCs = {}

    tentarAdicionar(workspace:FindFirstChild("RuntimeEnemies"))
    tentarAdicionar(workspace:FindFirstChild("InimigosExtras"))

    local towns = workspace:FindFirstChild("Towns")
    if towns then
        local function getZombies(townName)
            local town = towns:FindFirstChild(townName)
            if town then
                local part = town:FindFirstChild("ZombiePart")
                if part then
                    return part:FindFirstChild("Zombies")
                end
            end
            return nil
        end

        tentarAdicionar(getZombies("LargeTownTemplate"))
        tentarAdicionar(getZombies("SmallTownTemplate"))
        tentarAdicionar(getZombies("MediumTownTemplate"))

        for _, cidade in pairs(towns:GetChildren()) do
            local part = cidade:FindFirstChild("ZombiePart")
            if part then
                local z = part:FindFirstChild("Zombies")
                if z then
                    tentarAdicionar(z)
                end
            end
        end
    end

    local vivos = {}
    for _, caminho in ipairs(caminhosNPCs) do
        if caminho and caminho:IsDescendantOf(workspace) then
            for _, npc in ipairs(caminho:GetChildren()) do
                local hum = npc:FindFirstChild("Humanoid")
                if hum and hum.Health > 0 then
                    table.insert(vivos, npc)
                end
            end
        end
    end
    return vivos
end

local function ligar()
    if ativo then return end
    ativo = true

    listaNPCs = encontrarNPCsVivos() or {}
    if #listaNPCs > 0 then
        seguirNPC(listaNPCs[1])
        print("Ligado!")
    else
        print("Nenhum NPC vivo encontrado. Aguardando...")
    end

    verificadorLoop = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then return end
        if not conexao and (#listaNPCs == 0) then
            local novosNPCs = encontrarNPCsVivos()
            if novosNPCs and #novosNPCs > 0 then
                listaNPCs = novosNPCs
                seguirNPC(listaNPCs[1])
                print("Novos NPCs encontrados!")
            end
        end
    end)
end

-- BOTÃO NA TELA (ARRASTÁVEL)
local gui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
gui.ResetOnSpawn = false
gui.Name = "NPCSeguidorGUI"

local botao = Instance.new("TextButton")
botao.Size = UDim2.new(0, 140, 0, 50)
botao.Position = UDim2.new(0, 10, 1, -60)
botao.Text = "Ativar"
botao.TextScaled = true
botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
botao.TextColor3 = Color3.new(1, 1, 1)
botao.Parent = gui

-- Arrastar botão na tela (para celular)
local dragging, offset
botao.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        offset = input.Position - botao.AbsolutePosition
    end
end)

botao.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = false
    end
end)

game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.Touch then
        local newPos = input.Position - offset
        botao.Position = UDim2.new(0, newPos.X, 0, newPos.Y)
    end
end)

botao.MouseButton1Click:Connect(function()
    if ativo then
        desligar()
        botao.Text = "Ativar"
        botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
    else
        ligar()
        botao.Text = "Desligar"
        botao.BackgroundColor3 = Color3.fromRGB(200, 30, 30)
    end
end)
end)

CriarBotao("NPCs", "auto kill final", function()
local caminhoNPCs = workspace.Baseplates.FinalBasePlate.OutlawBase.StandaloneZombiePart.Zombies
local ativo = false

-- VARIÁVEIS
local player = game:GetService("Players").LocalPlayer
local cam = workspace.CurrentCamera
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local cameraOriginalSubject = humanoid
local cameraOriginalType = Enum.CameraType.Custom

local listaNPCs = {}
local conexao

-- FUNÇÕES
local function resetarCamera()
    cam.CameraSubject = cameraOriginalSubject
    cam.CameraType = cameraOriginalType
end

function desligar()
    ativo = false
    if conexao then
        conexao:Disconnect()
        conexao = nil
    end
    resetarCamera()
    print("Desligado e câmera restaurada.")
end

local function seguirNPC(npc)
    local hum = npc:FindFirstChild("Humanoid")
    if not hum then return end

    cam.CameraSubject = hum
    cam.CameraType = Enum.CameraType.Custom

    conexao = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then
            desligar()
            return
        end

        if hum.Health <= 0 or not npc:IsDescendantOf(workspace) then
            conexao:Disconnect()
            conexao = nil
            task.wait(0.5)
            table.remove(listaNPCs, 1)
            if #listaNPCs > 0 then
                seguirNPC(listaNPCs[1])
            else
                desligar()
            end
        end
    end)
end

function ligar()
    if ativo then return end
    ativo = true

    listaNPCs = caminhoNPCs:GetChildren()
    if #listaNPCs > 0 then
        seguirNPC(listaNPCs[1])
        print("Ligado!")
    else
        warn("Nenhum NPC encontrado.")
        desligar()
    end
end

-- BOTÃO NA TELA
local gui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
gui.ResetOnSpawn = false

local botao = Instance.new("TextButton")
botao.Size = UDim2.new(0, 140, 0, 50)
botao.Position = UDim2.new(0, 10, 1, -60)
botao.Text = "Ativar"
botao.TextScaled = true
botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
botao.TextColor3 = Color3.new(1, 1, 1)
botao.Parent = gui

botao.MouseButton1Click:Connect(function()
    if ativo then
        desligar()
        botao.Text = "Ativar"
        botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
    else
        ligar()
        botao.Text = "Desligar"
        botao.BackgroundColor3 = Color3.fromRGB(200, 30, 30)
    end
end)
end)

CriarBotao("Noclip", function()
local Player = game.Players.LocalPlayer
local Character = Player.Character or Player.CharacterAdded:Wait()

local function Noclip()
    for _, part in pairs(Character:GetDescendants()) do
        if part:IsA("BasePart") and part.CanCollide then
            part.CanCollide = false
        end
    end
end

game:GetService("RunService").Stepped:Connect(Noclip)
end)

CriarBotao("lock npc", function()
local caminhosNPCs = {}

local function tentarAdicionar(caminho)
    if caminho then
        table.insert(caminhosNPCs, caminho)
    end
end

-- VARIÁVEIS
local player = game:GetService("Players").LocalPlayer
local cam = workspace.CurrentCamera
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local cameraOriginalSubject = humanoid
local cameraOriginalType = Enum.CameraType.Custom

local ativo = false
local listaNPCs = {}
local conexao
local verificadorLoop

-- FUNÇÕES
local function resetarCamera()
    cam.CameraSubject = cameraOriginalSubject
    cam.CameraType = cameraOriginalType
end

local function desligar()
    ativo = false
    if conexao then
        conexao:Disconnect()
        conexao = nil
    end
    if verificadorLoop then
        verificadorLoop:Disconnect()
        verificadorLoop = nil
    end
    resetarCamera()
    print("Desligado e câmera restaurada.")
end

local function seguirNPC(npc)
    local hum = npc:FindFirstChild("Humanoid")
    if not hum then return end

    cam.CameraSubject = hum
    cam.CameraType = Enum.CameraType.Custom

    conexao = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then
            desligar()
            return
        end

        if hum.Health <= 0 or not npc:IsDescendantOf(workspace) then
            conexao:Disconnect()
            conexao = nil
            task.wait(0.5)
            table.remove(listaNPCs, 1)
            if #listaNPCs > 0 then
                seguirNPC(listaNPCs[1])
            else
                resetarCamera()
                print("Esperando novos NPCs vivos...")
            end
        end
    end)
end

local function encontrarNPCsVivos()
    caminhosNPCs = {}

    tentarAdicionar(workspace:FindFirstChild("RuntimeEnemies"))
    tentarAdicionar(workspace:FindFirstChild("InimigosExtras"))

    local towns = workspace:FindFirstChild("Towns")
    if towns then
        local function getZombies(townName)
            local town = towns:FindFirstChild(townName)
            if town then
                local part = town:FindFirstChild("ZombiePart")
                if part then
                    return part:FindFirstChild("Zombies")
                end
            end
            return nil
        end

        tentarAdicionar(getZombies("LargeTownTemplate"))
        tentarAdicionar(getZombies("SmallTownTemplate"))
        tentarAdicionar(getZombies("MediumTownTemplate"))

        for _, cidade in pairs(towns:GetChildren()) do
            local part = cidade:FindFirstChild("ZombiePart")
            if part then
                local z = part:FindFirstChild("Zombies")
                if z then
                    tentarAdicionar(z)
                end
            end
        end
    end

    local vivos = {}
    for _, caminho in ipairs(caminhosNPCs) do
        if caminho and caminho:IsDescendantOf(workspace) then
            for _, npc in ipairs(caminho:GetChildren()) do
                local hum = npc:FindFirstChild("Humanoid")
                if hum and hum.Health > 0 then
                    table.insert(vivos, npc)
                end
            end
        end
    end
    return vivos
end

local function ligar()
    if ativo then return end
    ativo = true

    listaNPCs = encontrarNPCsVivos() or {}
    if #listaNPCs > 0 then
        seguirNPC(listaNPCs[1])
        print("Ligado!")
    else
        print("Nenhum NPC vivo encontrado. Aguardando...")
    end

    verificadorLoop = game:GetService("RunService").Heartbeat:Connect(function()
        if not ativo then return end
        if not conexao and (#listaNPCs == 0) then
            local novosNPCs = encontrarNPCsVivos()
            if novosNPCs and #novosNPCs > 0 then
                listaNPCs = novosNPCs
                seguirNPC(listaNPCs[1])
                print("Novos NPCs encontrados!")
            end
        end
    end)
end

-- BOTÃO NA TELA (ARRASTÁVEL)
local gui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
gui.ResetOnSpawn = false
gui.Name = "NPCSeguidorGUI"

local botao = Instance.new("TextButton")
botao.Size = UDim2.new(0, 140, 0, 50)
botao.Position = UDim2.new(0, 10, 1, -60)
botao.Text = "Ativar"
botao.TextScaled = true
botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
botao.TextColor3 = Color3.new(1, 1, 1)
botao.Parent = gui

-- Arrastar botão na tela (para celular)
local dragging, offset
botao.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        offset = input.Position - botao.AbsolutePosition
    end
end)

botao.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.Touch then
        dragging = false
    end
end)

game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.Touch then
        local newPos = input.Position - offset
        botao.Position = UDim2.new(0, newPos.X, 0, newPos.Y)
    end
end)

botao.MouseButton1Click:Connect(function()
    if ativo then
        desligar()
        botao.Text = "Ativar"
        botao.BackgroundColor3 = Color3.fromRGB(30, 200, 30)
    else
        ligar()
        botao.Text = "Desligar"
        botao.BackgroundColor3 = Color3.fromRGB(200, 30, 30)
    end
end)
end)

-- ABA ITENS
CriarBotao("Itens", "auto colete", function()
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoidRootPart = character:WaitForChild("HumanoidRootPart")
local remote = game.ReplicatedStorage.Packages.RemotePromise.Remotes.C_ActivateObject
local distanciaMax = 25

local function obterParteCentral(obj)
    if obj:IsA("Model") then
        return obj.PrimaryPart or obj:FindFirstChildWhichIsA("BasePart")
    elseif obj:IsA("BasePart") then
        return obj
    end
    return nil
end

local function marcar(item, texto, cor)
    local gui = item:FindFirstChild("DEBUG_GUI")
    if not gui then
        gui = Instance.new("BillboardGui")
        gui.Name = "DEBUG_GUI"
        gui.Size = UDim2.new(0, 100, 0, 40)
        gui.StudsOffset = Vector3.new(0, 2, 0)
        gui.AlwaysOnTop = true
        gui.Parent = item

        local label = Instance.new("TextLabel", gui)
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.TextScaled = true
        label.Name = "Texto"
        label.TextColor3 = cor or Color3.new(1, 1, 1)
        label.Text = texto
    else
        gui.Texto.Text = texto
        gui.Texto.TextColor3 = cor or Color3.new(1, 1, 1)
    end
end

while true do
    for _, folder in pairs(workspace:GetDescendants()) do
        if folder:IsA("Folder") and folder.Name == "RuntimeItems" then
            for _, item in pairs(folder:GetChildren()) do
                local parte = obterParteCentral(item)
                if parte then
                    local dist = (humanoidRootPart.Position - parte.Position).Magnitude
                    if dist <= distanciaMax then
                        -- Tenta pegar até dar certo
                        spawn(function()
                            while true do
                                local sucesso, erro = pcall(function()
                                    remote:FireServer(item)
                                end)

                                if sucesso then
                                    marcar(item, "", Color3.fromRGB(0, 255, 0))
                                    print("Coletado com sucesso:", item.Name)
                                    break
                                else
                                    marcar(item, "RN-TEAM", Color3.fromRGB(255, 255, 0))
                                    print("RN-TEAM:", item.Name)
                                end

                                wait(1)
                            end
                        end)
                    end
                end
            end
        end
    end
    wait(0.2)
end
end)

CriarBotao("Itens", "Solda items", function()
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

--// Variáveis
local RemoteEvent = ReplicatedStorage.Shared.Network.RemoteEvent.RequestWeld
local platformPart = workspace.Train.Platform.Part
local dragging, dragStart, startPos

--// GUI
local screenGui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
screenGui.Name = "ClosestItemWeldGUI"
screenGui.ResetOnSpawn = false

local button = Instance.new("TextButton")
button.Parent = screenGui
button.Size = UDim2.new(0, 140, 0, 40)
button.Position = UDim2.new(0, 100, 0, 100)
button.Text = "items Mais Próximo"
button.BackgroundColor3 = Color3.fromRGB(40, 170, 255)
button.TextColor3 = Color3.new(1,1,1)
button.BorderSizePixel = 0
button.AutoButtonColor = true
button.Active = true

--// Drag
local function makeDraggable(gui)
    gui.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = gui.Position

            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    gui.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local delta = input.Position - dragStart
            gui.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X,
                                     startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        end
    end)
end

makeDraggable(button)

--// Função para verificar se o item tem DragWeldConstraint
local function hasDragWeldConstraint(item)
    if item:IsA("BasePart") then
        -- Verifica se a parte tem um DragWeldConstraint como filho direto
        for _, child in ipairs(item:GetChildren()) do
            if child:IsA("WeldConstraint") and child.Name == "DragWeldConstraint" then
                return true
            end
        end
    elseif item:IsA("Model") then
        -- Verifica em todos os descendentes do Model
        for _, descendant in ipairs(item:GetDescendants()) do
            if descendant:IsA("WeldConstraint") and descendant.Name == "DragWeldConstraint" then
                return true
            end
        end
    end
    return false
end

--// Função para encontrar item mais próximo (ignorando os com DragWeldConstraint)
local function getClosestItem()
    local character = player.Character or player.CharacterAdded:Wait()
    local root = character:WaitForChild("HumanoidRootPart")
    local closestItem = nil
    local closestDistance = math.huge

    for _, item in ipairs(workspace.RuntimeItems:GetChildren()) do
        -- Ignora itens que já têm DragWeldConstraint
        if not hasDragWeldConstraint(item) then
            local itemPos

            if item:IsA("BasePart") then
                itemPos = item.Position
            elseif item:IsA("Model") and item.PrimaryPart then
                itemPos = item.PrimaryPart.Position
            end

            if itemPos then
                local dist = (itemPos - root.Position).Magnitude
                if dist < closestDistance then
                    closestDistance = dist
                    closestItem = item
                end
            end
        end
    end

    return closestItem
end

--// Ao clicar, pegar item mais próximo e enviar para o RemoteEvent
button.MouseButton1Click:Connect(function()
    local closest = getClosestItem()
    if closest then
        RemoteEvent:FireServer(closest, platformPart)
    else
        warn("Nenhum item encontrado ou todos os itens já têm DragWeldConstraint.")
    end
end)
end)

-- ABA VISUAL
CriarBotao("Visual", "ESP jogador", function()
    for _, p in ipairs(Players:GetPlayers()) do
        if p ~= LocalPlayer and p.Character then
            if not p.Character:FindFirstChild("Highlight") then
                local h = Instance.new("Highlight")
                h.FillColor = Color3.fromRGB(0, 0, 0)
                h.OutlineColor = Color3.new(1, 1, 1)
                h.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
                h.Parent = p.Character
            end
        end
    end
end)

CriarBotao("Apagar Casas", function()
    local function deleteColorWalls()
        local count = 0
        for _, obj in pairs(workspace:GetDescendants()) do
            if obj.Name == "ColorWall" then
                obj:Destroy()
                count += 1
            end
        end
        print("Apagados:", count)
    end

    while true do
        deleteColorWalls()
        task.wait(5)
    end
end)

CriarBotao("Visual", "zom", function()
local player = game:GetService("Players").LocalPlayer

player.CameraMode = Enum.CameraMode.Classic

player.CameraMinZoomDistance = 0.5
player.CameraMaxZoomDistance = 30
end)

-- ABA OUTROS

CriarBotao("Outros", "Apagar Casas", function()
    local function deleteColorWalls()
        local count = 0
        for _, obj in pairs(workspace:GetDescendants()) do
            if obj.Name == "ColorWall" then
                obj:Destroy()
                count += 1
            end
        end
        print("Apagados:", count)
    end

    while true do
        deleteColorWalls()
        task.wait(5)
    end
end)

-- Atualiza o tamanho do canvas para todas as abas
for _, tab in pairs(Tabs) do
    tab.UIList:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
        tab.Frame.CanvasSize = UDim2.new(0, 0, 0, tab.UIList.AbsoluteContentSize.Y + 10)
    end)
end
