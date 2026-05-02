-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 31 mars 2026 à 09:30
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `e_etatcivil`
--

-- --------------------------------------------------------

--
-- Structure de la table `acte`
--

DROP TABLE IF EXISTS `acte`;
CREATE TABLE IF NOT EXISTS `acte` (
  `id_acte` int NOT NULL AUTO_INCREMENT,
  `num_acte` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('naissance','declaration_naissance','mariage','deces') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_acte` date NOT NULL,
  `temoin` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_numerique` text COLLATE utf8mb4_unicode_ci,
  `qr_code` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_demande` int NOT NULL,
  PRIMARY KEY (`id_acte`),
  UNIQUE KEY `num_acte` (`num_acte`),
  UNIQUE KEY `id_demande` (`id_demande`),
  KEY `idx_acte_num` (`num_acte`),
  KEY `idx_acte_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `acte_deces`
--

DROP TABLE IF EXISTS `acte_deces`;
CREATE TABLE IF NOT EXISTS `acte_deces` (
  `id_acte` int NOT NULL,
  `defunt` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_deces` date NOT NULL,
  `lieu_deces` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cause_deces` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `acte_mariage`
--

DROP TABLE IF EXISTS `acte_mariage`;
CREATE TABLE IF NOT EXISTS `acte_mariage` (
  `id_acte` int NOT NULL,
  `epoux1` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `epoux2` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_mariage` date NOT NULL,
  `lieu_mariage` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `acte_naissance`
--

DROP TABLE IF EXISTS `acte_naissance`;
CREATE TABLE IF NOT EXISTS `acte_naissance` (
  `id_acte` int NOT NULL,
  `enfant` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pere` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mere` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naissance` datetime NOT NULL,
  `lieu_naissance` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `acte_personne`
--

DROP TABLE IF EXISTS `acte_personne`;
CREATE TABLE IF NOT EXISTS `acte_personne` (
  `id_acte` int NOT NULL,
  `id_personne` int NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ex: defunt, epoux, temoin, enfant',
  PRIMARY KEY (`id_acte`,`id_personne`),
  KEY `fk_acte_personne_personne` (`id_personne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `administrateur`
--

DROP TABLE IF EXISTS `administrateur`;
CREATE TABLE IF NOT EXISTS `administrateur` (
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `agent`
--

DROP TABLE IF EXISTS `agent`;
CREATE TABLE IF NOT EXISTS `agent` (
  `id_user` int NOT NULL,
  `matricule` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_commune` int NOT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `matricule` (`matricule`),
  KEY `fk_agent_commune` (`id_commune`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `archive`
--

DROP TABLE IF EXISTS `archive`;
CREATE TABLE IF NOT EXISTS `archive` (
  `id_archive` int NOT NULL AUTO_INCREMENT,
  `date_archive` date NOT NULL DEFAULT (curdate()),
  `type_acte` enum('naissance','declaration_naissance','mariage','deces') COLLATE utf8mb4_unicode_ci NOT NULL,
  `commune` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_acte` int NOT NULL,
  PRIMARY KEY (`id_archive`),
  UNIQUE KEY `id_acte` (`id_acte`),
  KEY `idx_archive_type` (`type_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `arrondissement`
--

DROP TABLE IF EXISTS `arrondissement`;
CREATE TABLE IF NOT EXISTS `arrondissement` (
  `id_arrondissement` int NOT NULL AUTO_INCREMENT,
  `num_arrondissement` int NOT NULL,
  `nom_arrondissement` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_commune` int NOT NULL,
  PRIMARY KEY (`id_arrondissement`),
  KEY `fk_arrondissement_commune` (`id_commune`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `citoyen`
--

DROP TABLE IF EXISTS `citoyen`;
CREATE TABLE IF NOT EXISTS `citoyen` (
  `id_user` int NOT NULL,
  `numeroCIN` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `numeroCIN` (`numeroCIN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `commune`
--

DROP TABLE IF EXISTS `commune`;
CREATE TABLE IF NOT EXISTS `commune` (
  `id_commune` int NOT NULL AUTO_INCREMENT,
  `nom_commune` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `maire` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_commune`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `declaration`
--

DROP TABLE IF EXISTS `declaration`;
CREATE TABLE IF NOT EXISTS `declaration` (
  `id_declaration` int NOT NULL AUTO_INCREMENT,
  `type_declaration` enum('naissance','deces','mariage') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_declaration` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut_declaration` enum('en_attente','validee','refusee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `id_citoyen` int NOT NULL,
  `id_acte` int DEFAULT NULL,
  PRIMARY KEY (`id_declaration`),
  KEY `fk_declaration_citoyen` (`id_citoyen`),
  KEY `fk_declaration_acte` (`id_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demande`
--

DROP TABLE IF EXISTS `demande`;
CREATE TABLE IF NOT EXISTS `demande` (
  `id_demande` int NOT NULL AUTO_INCREMENT,
  `type_acte` enum('naissance','declaration_naissance','mariage','deces') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_depot` date NOT NULL DEFAULT (curdate()),
  `statut_demande` enum('en_attente','en_cours','validee','refusee','delivree') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `motif_refus` text COLLATE utf8mb4_unicode_ci,
  `date_maj` date DEFAULT NULL,
  `id_citoyen` int NOT NULL,
  `id_commune` int NOT NULL,
  `id_agent` int DEFAULT NULL,
  PRIMARY KEY (`id_demande`),
  KEY `fk_demande_citoyen` (`id_citoyen`),
  KEY `fk_demande_commune` (`id_commune`),
  KEY `fk_demande_agent` (`id_agent`),
  KEY `idx_demande_statut` (`statut_demande`),
  KEY `idx_demande_type` (`type_acte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ex: validation, refus, paiement',
  `lue` tinyint(1) NOT NULL DEFAULT '0',
  `date_envoi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_notification`),
  KEY `idx_notification_user` (`id_user`,`lue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiement`
--

DROP TABLE IF EXISTS `paiement`;
CREATE TABLE IF NOT EXISTS `paiement` (
  `id_paiement` int NOT NULL AUTO_INCREMENT,
  `montant` decimal(10,2) NOT NULL,
  `statut_paiement` enum('en_attente','confirme','echoue','annule') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `ref_transaction` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_paiement` date DEFAULT NULL,
  `id_demande` int NOT NULL,
  PRIMARY KEY (`id_paiement`),
  UNIQUE KEY `id_demande` (`id_demande`),
  UNIQUE KEY `ref_transaction` (`ref_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `personne`
--

DROP TABLE IF EXISTS `personne`;
CREATE TABLE IF NOT EXISTS `personne` (
  `id_personne` int NOT NULL AUTO_INCREMENT,
  `nom_personne` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom_personne` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` datetime DEFAULT NULL,
  `lieu_naissance` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `profession` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_personne`),
  KEY `idx_personne_nom` (`nom_personne`,`prenom_personne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `piece_jointe`
--

DROP TABLE IF EXISTS `piece_jointe`;
CREATE TABLE IF NOT EXISTS `piece_jointe` (
  `id_piece` int NOT NULL AUTO_INCREMENT,
  `date_depot` date NOT NULL DEFAULT (curdate()),
  `nom_fichier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_fichier` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ex: pdf, jpeg, png',
  `url_fichier` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taille_fichier` int NOT NULL COMMENT 'Taille en Ko',
  `id_demande` int NOT NULL,
  PRIMARY KEY (`id_piece`),
  KEY `fk_piece_demande` (`id_demande`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `statistique`
--

DROP TABLE IF EXISTS `statistique`;
CREATE TABLE IF NOT EXISTS `statistique` (
  `id_stat` int NOT NULL AUTO_INCREMENT,
  `type_stat` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valeur` int NOT NULL DEFAULT '0',
  `periode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ex: 2025-01, 2025-T1',
  `id_commune` int NOT NULL,
  PRIMARY KEY (`id_stat`),
  KEY `fk_statistique_commune` (`id_commune`),
  KEY `idx_statistique_periode` (`periode`,`id_commune`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nom_user` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom_user` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdp_user` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mot de passe hashé bcrypt',
  `role` enum('citoyen','agent','administrateur') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `date_inscription` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `acte`
--
ALTER TABLE `acte`
  ADD CONSTRAINT `fk_acte_demande` FOREIGN KEY (`id_demande`) REFERENCES `demande` (`id_demande`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `acte_deces`
--
ALTER TABLE `acte_deces`
  ADD CONSTRAINT `fk_acte_deces_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `acte_mariage`
--
ALTER TABLE `acte_mariage`
  ADD CONSTRAINT `fk_acte_mariage_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `acte_naissance`
--
ALTER TABLE `acte_naissance`
  ADD CONSTRAINT `fk_acte_naissance_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `acte_personne`
--
ALTER TABLE `acte_personne`
  ADD CONSTRAINT `fk_acte_personne_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_acte_personne_personne` FOREIGN KEY (`id_personne`) REFERENCES `personne` (`id_personne`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `administrateur`
--
ALTER TABLE `administrateur`
  ADD CONSTRAINT `fk_admin_utilisateur` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `agent`
--
ALTER TABLE `agent`
  ADD CONSTRAINT `fk_agent_commune` FOREIGN KEY (`id_commune`) REFERENCES `commune` (`id_commune`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_agent_utilisateur` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `archive`
--
ALTER TABLE `archive`
  ADD CONSTRAINT `fk_archive_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `arrondissement`
--
ALTER TABLE `arrondissement`
  ADD CONSTRAINT `fk_arrondissement_commune` FOREIGN KEY (`id_commune`) REFERENCES `commune` (`id_commune`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `citoyen`
--
ALTER TABLE `citoyen`
  ADD CONSTRAINT `fk_citoyen_utilisateur` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `declaration`
--
ALTER TABLE `declaration`
  ADD CONSTRAINT `fk_declaration_acte` FOREIGN KEY (`id_acte`) REFERENCES `acte` (`id_acte`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_declaration_citoyen` FOREIGN KEY (`id_citoyen`) REFERENCES `citoyen` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `demande`
--
ALTER TABLE `demande`
  ADD CONSTRAINT `fk_demande_agent` FOREIGN KEY (`id_agent`) REFERENCES `agent` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_citoyen` FOREIGN KEY (`id_citoyen`) REFERENCES `citoyen` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_demande_commune` FOREIGN KEY (`id_commune`) REFERENCES `commune` (`id_commune`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Contraintes pour la table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_utilisateur` FOREIGN KEY (`id_user`) REFERENCES `utilisateur` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `paiement`
--
ALTER TABLE `paiement`
  ADD CONSTRAINT `fk_paiement_demande` FOREIGN KEY (`id_demande`) REFERENCES `demande` (`id_demande`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `piece_jointe`
--
ALTER TABLE `piece_jointe`
  ADD CONSTRAINT `fk_piece_demande` FOREIGN KEY (`id_demande`) REFERENCES `demande` (`id_demande`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `statistique`
--
ALTER TABLE `statistique`
  ADD CONSTRAINT `fk_statistique_commune` FOREIGN KEY (`id_commune`) REFERENCES `commune` (`id_commune`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
