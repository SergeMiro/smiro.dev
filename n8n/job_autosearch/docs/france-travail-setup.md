# France Travail API — Setup Guide

## 1. Register on francetravail.io

1. Go to **https://francetravail.io** → "S'inscrire" (top right)
2. Create an account with your email (`l.almeras@fimainfo.fr` works)
3. Confirm via email link
4. Log in → top right "Mon espace" → **"Mes applications"**
5. Click **"Créer une nouvelle application"**
   - **Nom** : `job-autosearch` (or anything)
   - **Description** : `Recherche personnelle de vacances IT en France`
   - **Type** : Application "Confidentielle" (server-side)
6. After creation, you get:
   - `Identifiant client` → **client_id**
   - `Clé secrète` → **client_secret**
   - Save both — the secret is shown only once
7. In "Habilitations" tab → add the API:
   - Tick **"API Offres d'emploi v2"**
   - Save → wait for automatic approval (usually instant for public APIs)

## 2. Confirm scopes

For the Offres d'emploi v2 API the required OAuth2 scopes are:
```
api_offresdemploiv2 o2dsoffre
```

## 3. OAuth2 endpoints

| Purpose | URL |
|---|---|
| Token endpoint | `https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire` |
| Search endpoint | `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search` |
| Referentials | `https://api.francetravail.io/partenaire/offresdemploi/v2/referentiel/{name}` |

Token TTL: ~1500 seconds (25 min). n8n's OAuth2 credential refreshes automatically.

## 4. Test from VPS (after you have keys)

```bash
# Get token
TOKEN=$(curl -s -X POST \
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET&scope=api_offresdemploiv2 o2dsoffre" \
  | jq -r .access_token)

# Search
curl -s "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?motsCles=developpeur%20fullstack&departement=21&typeContrat=CDI&publieeDepuis=1" \
  -H "Authorization: Bearer $TOKEN" | jq '.resultats[] | {intitule, entreprise: .entreprise.nom, lieu: .lieuTravail.libelle, url: .origineOffre.urlOrigine}'
```

`departement=21` = Côte-d'Or (Dijon). For multiple departments use repeated `departement=` params or commune codes.

## 5. Useful query params

| Param | Meaning | Example |
|---|---|---|
| `motsCles` | Keywords | `developpeur fullstack` |
| `departement` | INSEE dept code | `21` (Côte-d'Or), `75` (Paris), `69` (Rhône) |
| `commune` | Commune INSEE | `21231` (Dijon) |
| `distance` | Radius km | `30` |
| `typeContrat` | Contract | `CDI`, `CDD`, `MIS` |
| `tempsPlein` | Full-time only | `true` |
| `publieeDepuis` | Days since post | `1`, `3`, `7`, `14`, `31` |
| `salaireMin` | Min annual € | `40000` |
| `range` | Pagination | `0-49` (max 150 per page) |

Full reference: https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation
