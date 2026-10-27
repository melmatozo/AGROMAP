-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 27/10/2026 às 14:00
-- Versão do servidor: 10.4.28-MariaDB
-- Versão do PHP: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `agromap_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `cultura`
--

CREATE TABLE `cultura` (
  `id_cultura` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `ciclo_medio` int(11) DEFAULT NULL,
  `unidade_producao` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `dados_climaticos`
--

CREATE TABLE `dados_climaticos` (
  `id_dado_climatico` int(11) NOT NULL,
  `data_coleta` date NOT NULL,
  `temperatura_media` decimal(8,2) DEFAULT NULL,
  `precipitacao` decimal(10,2) DEFAULT NULL,
  `umidade_media` decimal(8,2) DEFAULT NULL,
  `vento_medio` decimal(8,2) DEFAULT NULL,
  `fonte` varchar(100) DEFAULT NULL,
  `id_talhao` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `perdas`
--

CREATE TABLE `perdas` (
  `id_perda` int(11) NOT NULL,
  `data_registro` date NOT NULL,
  `tipo_perda` varchar(100) DEFAULT NULL,
  `causa` varchar(255) DEFAULT NULL,
  `quantidade_perdida` decimal(12,2) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `id_talhao` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `plantio`
--

CREATE TABLE `plantio` (
  `id_plantio` int(11) NOT NULL,
  `data_plantio` date DEFAULT NULL,
  `data_prevista_colheita` date DEFAULT NULL,
  `area_plantada` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Planejado',
  `id_talhao` int(11) NOT NULL,
  `id_cultura` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `previsao`
--

CREATE TABLE `previsao` (
  `id_previsao` int(11) NOT NULL,
  `data_previsao` datetime DEFAULT current_timestamp(),
  `producao_esperada` decimal(12,2) DEFAULT NULL,
  `cenario` varchar(100) DEFAULT NULL,
  `confianca` decimal(5,2) DEFAULT NULL,
  `modelo_utilizado` varchar(100) DEFAULT NULL,
  `id_plantio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `propriedade`
--

CREATE TABLE `propriedade` (
  `id_propriedade` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `localizacao` varchar(255) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `area_total` decimal(12,2) DEFAULT NULL,
  `hectares_plantados` decimal(12,2) DEFAULT NULL,
  `cultura_principal` varchar(100) DEFAULT NULL,
  `outras_culturas` varchar(255) DEFAULT NULL,
  `epoca_plantio` varchar(100) DEFAULT NULL,
  `irrigacao` varchar(50) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `data_cadastro` datetime DEFAULT current_timestamp(),
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `talhao`
--

CREATE TABLE `talhao` (
  `id_talhao` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `area` decimal(12,2) DEFAULT NULL,
  `tipo_solo` varchar(100) DEFAULT NULL,
  `id_propriedade` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `tipo_usuario` varchar(30) DEFAULT 'produtor',
  `data_cadastro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cultura`
--
ALTER TABLE `cultura`
  ADD PRIMARY KEY (`id_cultura`);

--
-- Índices de tabela `dados_climaticos`
--
ALTER TABLE `dados_climaticos`
  ADD PRIMARY KEY (`id_dado_climatico`),
  ADD KEY `fk_clima_talhao` (`id_talhao`);

--
-- Índices de tabela `perdas`
--
ALTER TABLE `perdas`
  ADD PRIMARY KEY (`id_perda`),
  ADD KEY `fk_perda_talhao` (`id_talhao`);

--
-- Índices de tabela `plantio`
--
ALTER TABLE `plantio`
  ADD PRIMARY KEY (`id_plantio`),
  ADD KEY `fk_plantio_talhao` (`id_talhao`),
  ADD KEY `fk_plantio_cultura` (`id_cultura`);

--
-- Índices de tabela `previsao`
--
ALTER TABLE `previsao`
  ADD PRIMARY KEY (`id_previsao`),
  ADD KEY `fk_previsao_plantio` (`id_plantio`);

--
-- Índices de tabela `propriedade`
--
ALTER TABLE `propriedade`
  ADD PRIMARY KEY (`id_propriedade`),
  ADD KEY `fk_propriedade_usuario` (`id_usuario`);

--
-- Índices de tabela `talhao`
--
ALTER TABLE `talhao`
  ADD PRIMARY KEY (`id_talhao`),
  ADD KEY `fk_talhao_propriedade` (`id_propriedade`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cultura`
--
ALTER TABLE `cultura`
  MODIFY `id_cultura` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `dados_climaticos`
--
ALTER TABLE `dados_climaticos`
  MODIFY `id_dado_climatico` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `perdas`
--
ALTER TABLE `perdas`
  MODIFY `id_perda` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `plantio`
--
ALTER TABLE `plantio`
  MODIFY `id_plantio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `previsao`
--
ALTER TABLE `previsao`
  MODIFY `id_previsao` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propriedade`
--
ALTER TABLE `propriedade`
  MODIFY `id_propriedade` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `talhao`
--
ALTER TABLE `talhao`
  MODIFY `id_talhao` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `dados_climaticos`
--
ALTER TABLE `dados_climaticos`
  ADD CONSTRAINT `fk_clima_talhao` FOREIGN KEY (`id_talhao`) REFERENCES `talhao` (`id_talhao`) ON DELETE CASCADE;

--
-- Restrições para tabelas `perdas`
--
ALTER TABLE `perdas`
  ADD CONSTRAINT `fk_perda_talhao` FOREIGN KEY (`id_talhao`) REFERENCES `talhao` (`id_talhao`) ON DELETE CASCADE;

--
-- Restrições para tabelas `plantio`
--
ALTER TABLE `plantio`
  ADD CONSTRAINT `fk_plantio_cultura` FOREIGN KEY (`id_cultura`) REFERENCES `cultura` (`id_cultura`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_plantio_talhao` FOREIGN KEY (`id_talhao`) REFERENCES `talhao` (`id_talhao`) ON DELETE CASCADE;

--
-- Restrições para tabelas `previsao`
--
ALTER TABLE `previsao`
  ADD CONSTRAINT `fk_previsao_plantio` FOREIGN KEY (`id_plantio`) REFERENCES `plantio` (`id_plantio`) ON DELETE CASCADE;

--
-- Restrições para tabelas `propriedade`
--
ALTER TABLE `propriedade`
  ADD CONSTRAINT `fk_propriedade_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;

--
-- Restrições para tabelas `talhao`
--
ALTER TABLE `talhao`
  ADD CONSTRAINT `fk_talhao_propriedade` FOREIGN KEY (`id_propriedade`) REFERENCES `propriedade` (`id_propriedade`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
