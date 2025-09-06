# Dependency Diagram

## Backend Modules
```mermaid
graph TD
    main[app/main.py] --> router_public
    main --> router_v2
    main --> models[(models import)]
    main --> models_v2[(models_v2 import)]
    router_public --> repo
    router_public --> service_external
    router_public --> service_logic
    router_public --> schemas
    router_public --> locks
    router_public --> utils
    router_public --> config
    router_v2 --> repo_v2
    router_v2 --> schemas
    router_v2 --> repo
    repo --> models
    repo --> db
    repo_v2 --> models_v2
    repo_v2 --> models
    db --> config
    service_external --> config
    service_logic --> utils
    models --> db
    models_v2 --> db
```

## Frontend v1 Modules
```mermaid
graph TD
    main_tsx[src/main.tsx] --> App
    App --> api_ts
    App --> admitted_counts[(admittedByAttribute)]
    App --> ConstraintBar
    App --> PersonCard
    App --> VenueOverview
    App --> StrategyControls
    App --> PlaybackControls
    api_ts --> types_ts
    ConstraintBar --> types_ts
    PersonCard --> types_ts
    VenueOverview --> types_ts
    StrategyControls --> types_ts
    PlaybackControls --> types_ts
    admitted_counts --> api_ts
```

## Frontend v2 Modules
```mermaid
graph TD
    main_tsx[frontend-2/src/main.tsx] --> App
    App --> Header
    App --> SwipeCard
    App --> AutoControls
    App --> ConstraintsPanel
    App --> VenueStats
    App --> FeasibilityBanner
    App --> Modals[LeaderboardModal, SettingsModal, ResultModal]
    App --> Toasts
    App --> hooks[useLocalStorage, useKeyboard, useToast]
    App --> api_ts
    SwipeCard --> imageLoader
    api_ts --> types_ts
    imageLoader --> signature_package[@berghain/signature]
    imageLoader --> types_ts
    Header --> Button
    Modals --> Modal
    Modals --> Button
    Button --> framer_motion
    Modal --> framer_motion
```

## Shared Packages
```mermaid
graph TD
    signature_src[packages/signature/src/index.ts] --> signature_dist[packages/signature/dist/]
    frontend2_imageLoader[frontend-2/src/lib/imageLoader.ts] --> signature_dist
    manifest_generator[scripts/generate-manifests.ts] --> signature_dist
```

## Images Generation & Manifest System
```mermaid
graph TD
    main_image[images_generation/main.py] --> runner
    runner --> config
    runner --> abbreviations
    runner --> combos
    runner --> fileio
    runner --> openai_client
    runner --> prompt_builder
    openai_client --> utils
    combos --> utils
    abbreviations --> utils
    prompt_builder --> config
    
    manifest_gen[scripts/generate-manifests.ts] --> signature_package[@berghain/signature]
    manifest_gen --> manifest_output[frontend-2/public/manifest/]
    images_output[images-generation/output/] --> manifest_gen
    frontend2_images[frontend-2/public/people/] --> manifest_gen
```
