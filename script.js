---Ghost Gui UI Library
loadstring(game:HttpGet('https://raw.githubusercontent.com/GhostPlayer352/UI-Library/refs/heads/main/Ghost%20Gui'))()
game.CoreGui.GhostGui.MainFrame.Title.Text = "MENU FRAM"
---
 
 
AddContent("TextButton", "apagar casas", [[
local function deleteColorWalls()
    local deletedCount = 0 -- Contador de objetos apagados

    -- Percorre todos os descendentes do Workspace
    for _, child in pairs(workspace:GetDescendants()) do
        if child.Name == "ColorWall" then
            child:Destroy() -- Apaga o objeto
            deletedCount = deletedCount + 1
        end
    end

    -- Exibe o resultado no console
    if deletedCount > 0 then
        print(deletedCount .. " objetos 'ColorWall' foram apagados.")
    else
        print("Nenhum objeto 'ColorWall' encontrado.")
    end
end

-- Loop a cada 5 segundos
while true do
    deleteColorWalls() -- Executa a função
    wait(5)
end
]])

AddContent("TextButton", "tp end", [[
-- Configurações do teleporte
local config = {
    vezesTeleporte = 200,          -- Quantidade de vezes que vai teleportar por posição
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
]])

AddContent("TextButton", "Noclip", [[
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
]])

AddContent("TextButton", "auto npcs do final", [[
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
]])

AddContent("TextButton", "lock npc", [[
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
]])

AddContent("TextButton", "zom", [[
local player = game:GetService("Players").LocalPlayer

player.CameraMode = Enum.CameraMode.Classic

player.CameraMinZoomDistance = 0.5
player.CameraMaxZoomDistance = 30
]])

AddContent("TextButton", "tp no trem", [[
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
]])
